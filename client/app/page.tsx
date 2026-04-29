"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const token = localStorage.getItem("lms_token");
    const role = localStorage.getItem("lms_role");
    if (!token) { router.replace("/auth/login"); return; }
    if (role === "borrower") { router.replace("/borrower/dashboard"); return; }
    router.replace("/dashboard");
  }, [router]);
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
