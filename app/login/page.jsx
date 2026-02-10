"use client";

import { useEffect, useState } from "react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "../lib/firebase";
import { useUser } from "../hooks/useUser";
import { useUserProfile } from "../hooks/useUserProfile";
import { mapAuthError } from "../lib/authErrors";

export default function LoginPage() {
  const router = useRouter();
  const [user, loading, authError] = useUser();
  const { loading: profileLoading, missing } = useUserProfile(user);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (authError) {
      setError(mapAuthError(authError, "login"));
    }
  }, [authError]);

  useEffect(() => {
    if (!user) return;
    if (profileLoading) return;
    if (missing) {
      setError("Account record not found. Contact admin.");
      signOut(auth);
      return;
    }
    router.replace("/dashboard");
  }, [user, profileLoading, missing, router]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace("/dashboard");
    } catch (err) {
      setError(mapAuthError(err, "login"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || (user && profileLoading)) {
    return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="glass-card w-full max-w-md rounded-2xl p-8">
        <h1 className="text-2xl font-semibold text-white mb-6">Sign In</h1>
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
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <button
          type="button"
          className="mt-4 text-sm text-blue-300 hover:text-blue-200"
          onClick={() => router.push("/register")}
        >
          Need an account? Sign up
        </button>
      </div>
    </div>
  );
}
