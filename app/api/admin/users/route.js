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

    const list = await adminAuth.listUsers(1000);
    const refs = list.users.map((user) => adminDb.collection("users").doc(user.uid));
    const docs = refs.length ? await adminDb.getAll(...refs) : [];
    const map = new Map();
    docs.forEach((doc) => {
      map.set(doc.id, doc.exists ? doc.data() : {});
    });

    const users = list.users.map((user) => {
      const data = map.get(user.uid) || {};
      const canGenerate = data.canGenerate !== false;
      return {
        uid: user.uid,
        email: user.email || "",
        displayName: user.displayName || "",
        disabled: Boolean(user.disabled),
        createdAt: user.metadata?.creationTime || "",
        role: data.role || "user",
        canGenerate
      };
    });

    return NextResponse.json({ users });
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
    const uid = body?.uid;
    const canGenerate = Boolean(body?.canGenerate);

    if (!uid) {
      return NextResponse.json({ error: "Missing uid" }, { status: 400 });
    }

    const userRef = adminDb.collection("users").doc(uid);
    await userRef.set(
      {
        canGenerate,
        updatedAt: new Date()
      },
      { merge: true }
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
