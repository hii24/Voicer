"use client";

import { useEffect, useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { auth, db } from "../lib/firebase";
import { useUser } from "../hooks/useUser";
import { mapAuthError } from "../lib/authErrors";

export default function RegisterPage() {
  const router = useRouter();
  const [user, loading, authError] = useUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (authError) {
      setError(mapAuthError(authError, "register"));
    }
  }, [authError]);

  useEffect(() => {
    if (user) {
      router.replace("/dashboard");
    }
  }, [user, router]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "users", result.user.uid), {
        email: result.user.email,
        createdAt: serverTimestamp(),
        role: "user",
        canGenerate: false
      });
      router.replace("/dashboard");
    } catch (err) {
      setError(mapAuthError(err, "register"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="glass-card w-full max-w-md rounded-2xl p-8">
        <h1 className="text-2xl font-semibold text-white mb-6">Create Account</h1>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm text-gray-300 mb-2">Email</label>
            <input
              type="email"
              className="w-full bg-gray-900/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500/50"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-2">Password</label>
            <input
              type="password"
              className="w-full bg-gray-900/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500/50"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          {error ? <div className="text-sm text-red-300">{error}</div> : null}
          {authError ? <div className="text-sm text-red-300">{authError.message}</div> : null}
          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold"
            disabled={submitting}
          >
            {submitting ? "Creating account..." : "Sign Up"}
          </button>
        </form>
        <button
          type="button"
          className="mt-4 text-sm text-blue-300 hover:text-blue-200"
          onClick={() => router.push("/login")}
        >
          Already have an account? Sign in
        </button>
      </div>
    </div>
  );
}
