"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Eye, EyeOff, ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      const res = await api.post("/auth/register", form);
      const { token, user } = res.data.data;
      localStorage.setItem("lms_token", token);
      localStorage.setItem("lms_role", user.role);
      localStorage.setItem("lms_user", JSON.stringify(user));
      router.push("/borrower/apply");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-950 via-brand-900 to-surface flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-64 h-64 bg-brand-500 rounded-full blur-3xl opacity-10" />
          <div className="absolute bottom-40 right-10 w-96 h-96 bg-brand-700 rounded-full blur-3xl opacity-10" />
        </div>
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center text-white font-bold text-lg">L</div>
          <span className="text-xl font-semibold text-white">LMS</span>
        </div>
        <div className="relative z-10 space-y-4">
          <h1 className="font-display text-4xl text-white leading-tight">Start your<br />loan journey.</h1>
          <p className="text-brand-300 text-lg">Create your account and apply for a loan in 4 simple steps.</p>
          <div className="space-y-3 pt-2">
            {["Sign up in seconds", "Verify your eligibility", "Upload documents", "Get your loan"].map((s, i) => (
              <div key={s} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-xs text-brand-400 font-semibold">{i + 1}</div>
                <span className="text-zinc-300 text-sm">{s}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 text-brand-500 text-sm">© 2026 Loan Management System</div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-fade-up">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-zinc-100 mb-1">Create account</h2>
            <p className="text-zinc-500 text-sm">Join as a borrower and apply for a loan</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input label="Full Name" type="text" placeholder="Krish Kumar" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input label="Email address" type="email" placeholder="you@example.com" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-300">Password <span className="text-red-400">*</span></label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} placeholder="Min. 6 characters"
                  value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 pr-10 rounded-lg bg-surface border border-surface-border text-zinc-100 placeholder:text-zinc-600 text-sm outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 hover:border-zinc-600"
                  required />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
            )}

            <Button type="submit" loading={loading} className="w-full" size="lg">
              Create account <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <p className="text-center text-sm text-zinc-500 mt-6">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
