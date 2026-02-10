"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  const [configForm, setConfigForm] = useState({ defaultTokens: "", maxTextLength: "" });
  const [configLoading, setConfigLoading] = useState(true);
  const [configSaving, setConfigSaving] = useState(false);
  const [tokenActions, setTokenActions] = useState({});
  const [tokenAmounts, setTokenAmounts] = useState({});

  const filtered = useMemo(() => {
    if (!query.trim()) return users;
    const value = query.trim().toLowerCase();
    return users.filter((item) => {
      const email = (item.email || "").toLowerCase();
      const uid = (item.uid || "").toLowerCase();
      const name = (item.displayName || "").toLowerCase();
      return email.includes(value) || uid.includes(value) || name.includes(value);
    });
  }, [users, query]);

  const loadUsers = useCallback(async () => {
    if (!user) return;
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
        return;
      }
      if (!res.ok) {
        const text = await res.text();
        setError(text || "Failed to load users");
        return;
      }
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      setError(err?.message || "Failed to load users");
    } finally {
      setFetching(false);
    }
  }, [user, router]);

  const loadConfig = useCallback(async () => {
    if (!user) return;
    setConfigLoading(true);
    setError("");
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/config", {
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
        return;
      }
      if (!res.ok) {
        const text = await res.text();
        setError(text || "Failed to load config");
        return;
      }
      const data = await res.json();
      setConfigForm({
        defaultTokens: String(typeof data.defaultTokens === "number" ? data.defaultTokens : 0),
        maxTextLength: String(typeof data.maxTextLength === "number" ? data.maxTextLength : 1000000)
      });
    } catch (err) {
      setError(err?.message || "Failed to load config");
    } finally {
      setConfigLoading(false);
    }
  }, [user, router]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
      return;
    }
    if (!user) return;

    loadUsers();
    loadConfig();
  }, [user, loading, router, loadUsers, loadConfig]);

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

  const applyTokenAction = async (target) => {
    if (!user) return;
    const action = tokenActions[target.uid] || "add";
    const amountRaw = tokenAmounts[target.uid];
    const amount = Number(amountRaw);
    if (!Number.isFinite(amount)) {
      setError("Enter a valid token amount.");
      return;
    }
    if (amount < 0) {
      setError("Token amount must be 0 or more.");
      return;
    }
    if ((action === "add" || action === "remove") && amount <= 0) {
      setError("Amount must be greater than 0.");
      return;
    }

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
        body: JSON.stringify({ uid: target.uid, tokenAction: action, amount })
      });
      if (!res.ok) {
        const text = await res.text();
        setError(text || "Token update failed");
        return;
      }
      await loadUsers();
      setTokenAmounts((prev) => ({ ...prev, [target.uid]: "" }));
    } catch (err) {
      setError(err?.message || "Token update failed");
    } finally {
      setUpdatingId("");
    }
  };

  const saveConfig = async () => {
    if (!user) return;
    const defaultTokens = Number(configForm.defaultTokens);
    const maxTextLength = Number(configForm.maxTextLength);
    if (!Number.isFinite(defaultTokens) || defaultTokens < 0) {
      setError("Default tokens must be 0 or more.");
      return;
    }
    if (!Number.isFinite(maxTextLength) || maxTextLength < 1) {
      setError("Max text length must be 1 or more.");
      return;
    }

    setConfigSaving(true);
    setError("");
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          defaultTokens: Math.floor(defaultTokens),
          maxTextLength: Math.floor(maxTextLength)
        })
      });
      if (!res.ok) {
        const text = await res.text();
        setError(text || "Failed to save config");
        return;
      }
      await loadConfig();
    } catch (err) {
      setError(err?.message || "Failed to save config");
    } finally {
      setConfigSaving(false);
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

        {error ? <div className="mb-4 text-sm text-red-300">{error}</div> : null}

        <div className="glass-card rounded-2xl p-5 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl font-semibold text-white">System Settings</h2>
              <p className="text-sm text-gray-400">Defaults applied to new accounts.</p>
            </div>
            <button
              type="button"
              className="px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-70"
              onClick={saveConfig}
              disabled={configSaving || configLoading}
            >
              {configSaving ? "Saving..." : "Save Settings"}
            </button>
          </div>

          {configLoading ? (
            <div className="text-gray-400">Loading config...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Default Tokens</label>
                <input
                  type="number"
                  min="0"
                  value={configForm.defaultTokens}
                  onChange={(event) =>
                    setConfigForm((prev) => ({ ...prev, defaultTokens: event.target.value }))
                  }
                  className="w-full bg-gray-900/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Max Text Length</label>
                <input
                  type="number"
                  min="1"
                  value={configForm.maxTextLength}
                  onChange={(event) =>
                    setConfigForm((prev) => ({ ...prev, maxTextLength: event.target.value }))
                  }
                  className="w-full bg-gray-900/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500/50"
                />
              </div>
            </div>
          )}
        </div>

        <div className="glass-card rounded-2xl p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Admin Panel</h2>
              <p className="text-sm text-gray-400">Manage generation access and tokens.</p>
            </div>
            <input
              type="text"
              placeholder="Search by email or uid"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full sm:w-72 bg-gray-900/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500/50"
            />
          </div>

          <div className="space-y-3">
            {fetching ? (
              <div className="text-gray-400">Loading users...</div>
            ) : filtered.length ? (
              filtered.map((item) => (
                <div
                  key={item.uid}
                  className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white/5 rounded-xl p-4"
                >
                  <div className="flex flex-col">
                    <span className="text-white font-medium">{item.email || "No email"}</span>
                    <span className="text-xs text-gray-400">{item.uid}</span>
                    <span className="text-xs text-gray-500">{item.createdAt}</span>
                    <span className="text-xs text-gray-400 mt-1">
                      Balance: {typeof item.tokenBalance === "number" ? item.tokenBalance.toLocaleString() : 0} · Used:{" "}
                      {typeof item.tokenUsed === "number" ? item.tokenUsed.toLocaleString() : 0}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs self-start sm:self-auto ${
                        item.canGenerate ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"
                      }`}
                    >
                      {item.canGenerate ? "Allowed" : "Blocked"}
                    </span>
                    <div className="flex items-center gap-2">
                      <select
                        value={tokenActions[item.uid] || "add"}
                        onChange={(event) =>
                          setTokenActions((prev) => ({ ...prev, [item.uid]: event.target.value }))
                        }
                        className="bg-gray-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                      >
                        <option value="add">Add</option>
                        <option value="remove">Remove</option>
                        <option value="set">Set</option>
                      </select>
                      <input
                        type="number"
                        min="0"
                        placeholder="Amount"
                        value={tokenAmounts[item.uid] ?? ""}
                        onChange={(event) =>
                          setTokenAmounts((prev) => ({ ...prev, [item.uid]: event.target.value }))
                        }
                        className="w-24 bg-gray-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                      />
                      <button
                        type="button"
                        className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-70"
                        onClick={() => applyTokenAction(item)}
                        disabled={updatingId === item.uid}
                      >
                        {updatingId === item.uid ? "Saving" : "Apply"}
                      </button>
                    </div>
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
