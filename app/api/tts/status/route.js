import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "../../../lib/firebase-admin";

export const runtime = "nodejs";

export async function GET(req) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(token);
    const userId = decoded.uid;

    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get("taskId");
    if (!taskId) {
      return NextResponse.json({ error: "Missing taskId" }, { status: 400 });
    }

    const taskRef = adminDb.collection("users").doc(userId).collection("tasks").doc(taskId);
    const taskSnap = await taskRef.get();
    if (!taskSnap.exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const task = taskSnap.data();
    if (task.status === "completed") {
      return NextResponse.json({ status: "completed", progress: 100, downloadUrl: task.downloadUrl || "" });
    }
    if (task.status === "failed") {
      return NextResponse.json({ status: "failed", progress: task.progress || 0, error: task.error || "Failed" });
    }

    const voicerTaskId = task.voicer_task_id;
    if (!voicerTaskId) {
      return NextResponse.json({ status: task.status || "queued", progress: task.progress || 0 });
    }

    const apiKey = process.env.VOICER_API_KEY;
    const apiBase =
      process.env.VOICER_API_BASE_URL || "https://elevenlabs-unlimited.net/api/v1";
    if (!apiKey) {
      await taskRef.update({ status: "failed", error: "Missing VOICER_API_KEY" });
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const voicerRes = await fetch(`${apiBase}/voice/status/${voicerTaskId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    });

    if (!voicerRes.ok) {
      return NextResponse.json({ status: task.status || "processing", progress: task.progress || 0 });
    }

    const data = await voicerRes.json();
    const status = data.status || task.status || "processing";
    const progress = typeof data.progress === "number" ? data.progress : task.progress || 0;

    if (status === "completed") {
      await taskRef.update({ status: "completed", progress: 100 });
      return NextResponse.json({ status: "completed", progress: 100 });
    }

    if (status === "failed") {
      await taskRef.update({ status: "failed", error: data.error || "Failed", progress });
      return NextResponse.json({ status: "failed", progress, error: data.error || "Failed" });
    }

    await taskRef.update({ status, progress });
    return NextResponse.json({ status, progress });
  } catch (err) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
