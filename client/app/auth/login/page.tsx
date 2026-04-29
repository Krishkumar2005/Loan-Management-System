"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Eye, EyeOff, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", form);
      const { token, user } = res.data.data;
      localStorage.setItem("lms_token", token);
      localStorage.setItem("lms_role", user.role);
      localStorage.setItem("lms_user", JSON.stringify(user));
      if (user.role === "borrower") router.push("/borrower/dashboard");
      else router.push("/dashboard");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-950 via-brand-900 to-surface flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-64 h-64 bg-brand-500 rounded-full blur-3xl opacity-20" />
          <div className="absolute bottom-40 right-10 w-96 h-96 bg-brand-700 rounded-full blur-3xl opacity-20" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center text-white font-bold text-lg">L</div>
            <span className="text-xl font-semibold text-white tracking-tight">LMS</span>
          </div>
        </div>
        <div className="relative z-10 space-y-4">
          <h1 className="font-display text-4xl text-white leading-tight">
            Smarter lending,<br />built for everyone.
          </h1>
          <p className="text-brand-300 text-lg">Apply for a loan in minutes or manage your portfolio with precision.</p>
          <div className="flex gap-8 pt-4">
            {[["₹50K–₹5L", "Loan Range"], ["12% p.a.", "Fixed Rate"], ["365 days", "Max Tenure"]].map(([val, lbl]) => (
              <div key={lbl}>
                <div className="text-white font-semibold text-lg">{val}</div>
                <div className="text-brand-400 text-sm">{lbl}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 text-brand-500 text-sm">© 2026 Loan Management System</div>
      </div>

      {/* Right panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-fade-up">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-zinc-100 mb-1">Welcome back</h2>
            <p className="text-zinc-500 text-sm">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-300">Password <span className="text-red-400">*</span></label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 pr-10 rounded-lg bg-surface border border-surface-border text-zinc-100 placeholder:text-zinc-600 text-sm outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 hover:border-zinc-600"
                  required
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full" size="lg">
              Sign in <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <p className="text-center text-sm text-zinc-500 mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/auth/register" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
              Create one
            </Link>
          </p>

          {/* Quick login hints */}
          <div className="mt-8 p-4 rounded-xl bg-surface-card border border-surface-border">
            <p className="text-xs font-medium text-zinc-500 mb-3 uppercase tracking-wider">Test Accounts</p>
            <div className="space-y-1.5">
              {[
                ["Borrower", "borrower@lms.com", "borrower123"],
                ["Admin", "admin@lms.com", "admin123"],
                ["Sales", "sales@lms.com", "sales123"],
                ["Sanction", "sanction@lms.com", "sanction123"],
                ["Disbursement", "disbursement@lms.com", "disbursement123"],
                ["Collection", "collection@lms.com", "collection123"],
              ].map(([role, email, pw]) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setForm({ email, password: pw })}
                  className="w-full text-left flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-surface-hover transition-colors group"
                >
                  <span className="text-xs text-zinc-400 group-hover:text-zinc-300">{role}</span>
                  <span className="text-xs text-zinc-600 font-mono">{email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
