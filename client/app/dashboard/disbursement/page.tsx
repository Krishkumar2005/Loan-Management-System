"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import Navbar from "@/components/ui/Navbar";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Loan, User } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Banknote, ArrowLeft, Send } from "lucide-react";
import Link from "next/link";

export default function DisbursementPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(""), 3000); };

  useEffect(() => {
    const u = localStorage.getItem("lms_user");
    if (!u) { router.replace("/auth/login"); return; }
    const parsed = JSON.parse(u);
    if (!["admin","disbursement"].includes(parsed.role)) { router.replace("/dashboard"); return; }
    setUser(parsed);
    fetchLoans();
  }, [router]);

  const fetchLoans = () => {
    api.get("/dashboard/disbursement/loans")
      .then(r => setLoans(r.data.data.loans))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const disburse = async (id: string) => {
    setActionLoading(id);
    try {
      await api.patch(`/dashboard/disbursement/loans/${id}/disburse`);
      showToast("Loan disbursed successfully! Funds released.");
      fetchLoans();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      showToast(e.response?.data?.message || "Failed to disburse");
    } finally { setActionLoading(null); }
  };

  return (
    <div className="min-h-screen bg-surface">
      <Navbar userName={user?.name} role={user?.role} />
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-surface-card border border-surface-border px-4 py-3 rounded-xl text-sm text-zinc-200 shadow-2xl animate-fade-up">
          {toastMsg}
        </div>
      )}
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center gap-4 mb-8 animate-fade-up">
          <Link href="/dashboard" className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-zinc-100 flex items-center gap-2">
              <Banknote className="w-5 h-5 text-brand-400" /> Disbursement Module
            </h1>
            <p className="text-zinc-500 text-sm mt-0.5">Release funds for sanctioned loans</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : loans.length === 0 ? (
          <div className="bg-surface-card border border-surface-border rounded-xl py-16 text-center animate-fade-up">
            <Banknote className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500">No loans pending disbursement</p>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-up animate-delay-100">
            {loans.map((loan) => {
              const borrower = loan.borrower as User;
              const sanctioner = loan.sanctionedBy as User;
              return (
                <div key={loan._id} className="bg-surface-card border border-surface-border rounded-xl p-6 hover:border-zinc-600 transition-all">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-semibold text-zinc-100 text-lg">{formatCurrency(loan.loanAmount)}</span>
                        <Badge status={loan.status} />
                      </div>
                      <p className="text-sm text-zinc-400 mb-4">
                        {typeof borrower === "object" ? `${borrower.name} — ${borrower.email}` : ""}
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                        {[
                          ["Borrower Name", loan.fullName],
                          ["Tenure", `${loan.tenure} days`],
                          ["Total Repayment", formatCurrency(loan.totalRepayment)],
                          ["Interest (SI)", formatCurrency(loan.simpleInterest)],
                          ["Sanctioned On", formatDate(loan.sanctionedAt || "")],
                          ["Sanctioned By", typeof sanctioner === "object" ? sanctioner.name : "—"],
                        ].map(([l, v]) => (
                          <div key={l}>
                            <p className="text-zinc-500 text-xs">{l}</p>
                            <p className="text-zinc-200 font-medium">{v}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="shrink-0">
                      <Button onClick={() => disburse(loan._id)} loading={actionLoading === loan._id} size="md">
                        <Send className="w-4 h-4" /> Disburse Funds
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
