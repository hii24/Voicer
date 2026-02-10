import { NextResponse } from "next/server";
import { adminDb } from "../../lib/firebase-admin";

export const runtime = "nodejs";

export async function GET() {
  try {
    const snap = await adminDb.collection("config").doc("system").get();
    const data = snap.exists ? snap.data() : {};
    const defaultTokens = typeof data.defaultTokens === "number" ? data.defaultTokens : 0;
    const maxTextLength = typeof data.maxTextLength === "number" ? data.maxTextLength : 1000000;

    return NextResponse.json({ defaultTokens, maxTextLength });
  } catch (err) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
