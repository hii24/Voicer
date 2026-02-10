import { NextResponse } from "next/server";
import { adminAuth } from "../../../lib/firebase-admin";

export const runtime = "nodejs";

export async function GET(req) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await adminAuth.verifyIdToken(token);

    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get("taskId");
    if (!taskId) {
      return NextResponse.json({ error: "Missing taskId" }, { status: 400 });
    }

    const apiKey = process.env.VOICER_API_KEY;
    const apiBase =
      process.env.VOICER_API_BASE_URL || "https://elevenlabs-unlimited.net/api/v1";
    if (!apiKey) {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const fileRes = await fetch(`${apiBase}/voice/download/${taskId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    });

    if (!fileRes.ok) {
      const text = await fileRes.text();
      return NextResponse.json({ error: text || "Download failed" }, { status: 500 });
    }

    const contentType = fileRes.headers.get("content-type") || "audio/mpeg";
    const arrayBuffer = await fileRes.arrayBuffer();
    const extension = contentType.includes("zip") ? "zip" : "mp3";

    return new Response(Buffer.from(arrayBuffer), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename=voice-${taskId}.${extension}`
      }
    });
  } catch (err) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
