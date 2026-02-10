import { NextResponse } from "next/server";
import { z } from "zod";
import { adminAuth, adminDb } from "../../../lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export const runtime = "nodejs";

const schema = z.object({
  text: z.string().min(1).max(1000000),
  voice_id: z.string().min(1).optional(),
  model_id: z.string().min(1).optional(),
  split_type: z.string().optional(),
  max_chunk_length: z.number().optional(),
  split_output: z.boolean().optional(),
  auto_pause_enabled: z.boolean().optional(),
  auto_pause_duration: z.number().optional(),
  auto_pause_frequency: z.number().optional()
});

export async function POST(req) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(token);
    const userId = decoded.uid;
    const userRef = adminDb.collection("users").doc(userId);

    const body = schema.parse(await req.json());

    const configSnap = await adminDb.collection("config").doc("system").get();
    const config = configSnap.exists ? configSnap.data() : {};
    const maxTextLength = typeof config.maxTextLength === "number" ? config.maxTextLength : 1000000;

    if (body.text.length > maxTextLength) {
      return NextResponse.json({ error: `Text exceeds ${maxTextLength} characters` }, { status: 400 });
    }

    const tokenCost = body.text.length;
    const taskRef = adminDb.collection("users").doc(userId).collection("tasks").doc();

    await adminDb.runTransaction(async (tx) => {
      const userSnap = await tx.get(userRef);
      if (!userSnap.exists) {
        throw new Error("ACCOUNT_NOT_FOUND");
      }
      const userData = userSnap.data();
      if (userData.canGenerate === false) {
        throw new Error("ACCESS_DENIED");
      }

      const balance = typeof userData.tokenBalance === "number" ? userData.tokenBalance : 0;
      const used = typeof userData.tokenUsed === "number" ? userData.tokenUsed : 0;

      if (balance < tokenCost) {
        throw new Error("INSUFFICIENT_TOKENS");
      }

      tx.update(userRef, {
        tokenBalance: balance - tokenCost,
        tokenUsed: used + tokenCost
      });

      tx.set(taskRef, {
        createdAt: FieldValue.serverTimestamp(),
        status: "queued",
        progress: 0,
        text: body.text,
        text_preview: body.text.slice(0, 100),
        text_length: body.text.length,
        token_cost: tokenCost,
        token_refunded: false,
        settings: {
          voice_id: body.voice_id || null,
          model_id: body.model_id || null,
          split_type: body.split_type || null,
          max_chunk_length: body.max_chunk_length || null,
          split_output: body.split_output || false,
          auto_pause_enabled: body.auto_pause_enabled || false,
          auto_pause_duration: body.auto_pause_duration || null,
          auto_pause_frequency: body.auto_pause_frequency || null
        }
      });
    });

    const apiKey = process.env.VOICER_API_KEY;
    const apiBase = process.env.VOICER_API_BASE_URL || "https://elevenlabs-unlimited.net/api/v1";
    if (!apiKey) {
      await refundTokens(userRef, taskRef, "Missing VOICER_API_KEY");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const payload = {
      text: body.text,
      voice_id: body.voice_id || "AB9XsbSA4eLG12t2myjN",
      model_id: body.model_id || "eleven_multilingual_v2",
      split_type: body.split_type,
      max_chunk_length: body.max_chunk_length,
      split_output: body.split_output,
      auto_pause_enabled: body.auto_pause_enabled,
      auto_pause_duration: body.auto_pause_duration,
      auto_pause_frequency: body.auto_pause_frequency
    };

    const voicerRes = await fetch(`${apiBase}/voice/synthesize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!voicerRes.ok) {
      const errorText = await voicerRes.text();
      await refundTokens(userRef, taskRef, errorText || "Voicer API error");
      return NextResponse.json({ error: "Voicer API error" }, { status: 500 });
    }

    const contentType = voicerRes.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      await refundTokens(userRef, taskRef, "Unexpected response format");
      return NextResponse.json({ error: "Unexpected response format" }, { status: 500 });
    }

    const data = await voicerRes.json();
    const remoteTaskId = data.task_id || data.taskId;
    if (!remoteTaskId) {
      await refundTokens(userRef, taskRef, "Missing task_id");
      return NextResponse.json({ error: "Voicer response missing task_id" }, { status: 500 });
    }

    await taskRef.update({ status: "queued", voicer_task_id: remoteTaskId });
    return NextResponse.json({ taskId: taskRef.id, status: "queued" });
  } catch (err) {
    if (err?.message === "ACCOUNT_NOT_FOUND") {
      return NextResponse.json({ error: "Account record not found" }, { status: 403 });
    }
    if (err?.message === "ACCESS_DENIED") {
      return NextResponse.json({ error: "Generation access denied" }, { status: 403 });
    }
    if (err?.message === "INSUFFICIENT_TOKENS") {
      return NextResponse.json({ error: "Not enough tokens" }, { status: 403 });
    }
    if (err?.issues) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}

async function refundTokens(userRef, taskRef, message) {
  await adminDb.runTransaction(async (tx) => {
    const taskSnap = await tx.get(taskRef);
    if (!taskSnap.exists) return;
    const task = taskSnap.data();
    if (task.token_refunded) return;

    const cost = typeof task.token_cost === "number" ? task.token_cost : 0;
    const userSnap = await tx.get(userRef);
    if (userSnap.exists && cost > 0) {
      const userData = userSnap.data();
      const balance = typeof userData.tokenBalance === "number" ? userData.tokenBalance : 0;
      const used = typeof userData.tokenUsed === "number" ? userData.tokenUsed : 0;
      tx.update(userRef, {
        tokenBalance: balance + cost,
        tokenUsed: Math.max(0, used - cost)
      });
    }

    tx.update(taskRef, { status: "failed", error: message, token_refunded: true });
  });
}
