"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Dashboard from "../components/dashboard/Dashboard";
import { useUser } from "../hooks/useUser";

export default function DashboardPage() {
  const router = useRouter();
  const [user, loading] = useUser();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return <Dashboard user={user} />;
}
