"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/dashboard/Header";
import { useUser } from "../hooks/useUser";

export default function AdminPage() {
  const router = useRouter();
  const [user, loading] = useUser();
  const [users, setUsers] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return users;
    const value = query.trim().toLowerCase();
    return users.filter(
      (item) =>
        item.email.toLowerCase().includes(value) ||
        item.uid.toLowerCase().includes(value) ||
        item.displayName.toLowerCase().includes(value)
    );
  }, [users, query]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
      return;
    }
    if (!user) return;

    const load = async () => {
      setFetching(true);
      setError("");
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/admin/users", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        if (res.status === 403) {
          setError("Access denied. You are not an admin.");
          setFetching(false);
          return;
        }
        if (!res.ok) {
          const text = await res.text();
          setError(text || "Failed to load users");
          setFetching(false);
          return;
        }
        const data = await res.json();
        setUsers(data.users || []);
      } catch (err) {
        setError(err?.message || "Failed to load users");
      } finally {
        setFetching(false);
      }
    };

    load();
  }, [user, loading, router]);

  const toggleAccess = async (target) => {
    if (!user) return;
    setUpdatingId(target.uid);
    setError("");
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ uid: target.uid, canGenerate: !target.canGenerate })
      });
      if (!res.ok) {
        const text = await res.text();
        setError(text || "Update failed");
        return;
      }
      setUsers((prev) =>
        prev.map((item) =>
          item.uid === target.uid ? { ...item, canGenerate: !target.canGenerate } : item
        )
      );
    } catch (err) {
      setError(err?.message || "Update failed");
    } finally {
      setUpdatingId("");
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 pb-10 pt-6">
        <Header />

        <div className="glass-card rounded-2xl p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Admin Panel</h2>
              <p className="text-sm text-gray-400">Manage generation access for users.</p>
            </div>
            <input
              type="text"
              placeholder="Search by email or uid"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full sm:w-72 bg-gray-900/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500/50"
            />
          </div>

          {error ? <div className="mb-4 text-sm text-red-300">{error}</div> : null}

          <div className="space-y-3">
            {fetching ? (
              <div className="text-gray-400">Loading users...</div>
            ) : filtered.length ? (
              filtered.map((item) => (
                <div
                  key={item.uid}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white/5 rounded-xl p-4"
                >
                  <div className="flex flex-col">
                    <span className="text-white font-medium">{item.email || "No email"}</span>
                    <span className="text-xs text-gray-400">{item.uid}</span>
                    <span className="text-xs text-gray-500">{item.createdAt}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs ${
                        item.canGenerate ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"
                      }`}
                    >
                      {item.canGenerate ? "Allowed" : "Blocked"}
                    </span>
                    <button
                      type="button"
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                        item.canGenerate
                          ? "bg-red-600 text-white hover:bg-red-700"
                          : "bg-green-600 text-white hover:bg-green-700"
                      }`}
                      disabled={updatingId === item.uid}
                      onClick={() => toggleAccess(item)}
                    >
                      {updatingId === item.uid
                        ? "Updating..."
                        : item.canGenerate
                          ? "Revoke Access"
                          : "Grant Access"}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-400">No users found.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
