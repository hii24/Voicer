import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "../../../lib/firebase-admin";

export const runtime = "nodejs";

const isAdminUser = (decoded, userData) => {
  const email = (decoded.email || "").toLowerCase();
  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  return (
    decoded.admin === true ||
    decoded.super_admin === true ||
    decoded.role === "super_admin" ||
    userData?.role === "super_admin" ||
    adminEmails.includes(email)
  );
};

export async function GET(req) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(token);
    const adminSnap = await adminDb.collection("users").doc(decoded.uid).get();
    const adminData = adminSnap.exists ? adminSnap.data() : {};

    if (!isAdminUser(decoded, adminData)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const snap = await adminDb.collection("config").doc("system").get();
    const data = snap.exists ? snap.data() : {};

    return NextResponse.json({
      defaultTokens: typeof data.defaultTokens === "number" ? data.defaultTokens : 0,
      maxTextLength: typeof data.maxTextLength === "number" ? data.maxTextLength : 1000000
    });
  } catch (err) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(token);
    const adminSnap = await adminDb.collection("users").doc(decoded.uid).get();
    const adminData = adminSnap.exists ? adminSnap.data() : {};

    if (!isAdminUser(decoded, adminData)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const updates = {};

    if (typeof body.defaultTokens === "number" && body.defaultTokens >= 0) {
      updates.defaultTokens = Math.floor(body.defaultTokens);
    }
    if (typeof body.maxTextLength === "number" && body.maxTextLength >= 1) {
      updates.maxTextLength = Math.floor(body.maxTextLength);
    }
    updates.updatedAt = new Date();

    await adminDb.collection("config").doc("system").set(updates, { merge: true });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
