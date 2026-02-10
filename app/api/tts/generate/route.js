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

    const userSnap = await adminDb.collection("users").doc(userId).get();
    if (!userSnap.exists) {
      return NextResponse.json({ error: "Account record not found" }, { status: 403 });
    }
    const userData = userSnap.data();
    if (userData.canGenerate === false) {
      return NextResponse.json({ error: "Generation access denied" }, { status: 403 });
    }

    const body = schema.parse(await req.json());

    const taskRef = adminDb.collection("users").doc(userId).collection("tasks").doc();
    await taskRef.set({
      createdAt: FieldValue.serverTimestamp(),
      status: "queued",
      progress: 0,
      text: body.text,
      text_preview: body.text.slice(0, 100),
      text_length: body.text.length,
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

    const apiKey = process.env.VOICER_API_KEY;
    const apiBase =
      process.env.VOICER_API_BASE_URL || "https://elevenlabs-unlimited.net/api/v1";
    if (!apiKey) {
      await taskRef.update({ status: "failed", error: "Missing VOICER_API_KEY" });
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
      await taskRef.update({ status: "failed", error: errorText || "Voicer API error" });
      return NextResponse.json({ error: "Voicer API error" }, { status: 500 });
    }

    const contentType = voicerRes.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      await taskRef.update({ status: "failed", error: "Unexpected response format" });
      return NextResponse.json({ error: "Unexpected response format" }, { status: 500 });
    }

    const data = await voicerRes.json();
    const remoteTaskId = data.task_id || data.taskId;
    if (!remoteTaskId) {
      await taskRef.update({ status: "failed", error: "Missing task_id" });
      return NextResponse.json({ error: "Voicer response missing task_id" }, { status: 500 });
    }

    await taskRef.update({ status: "queued", voicer_task_id: remoteTaskId });
    return NextResponse.json({ taskId: taskRef.id, status: "queued" });
  } catch (err) {
    if (err?.issues) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
