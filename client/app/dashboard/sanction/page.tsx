"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import Navbar from "@/components/ui/Navbar";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Loan, User } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ShieldCheck, ArrowLeft, CheckCircle2, XCircle, FileText } from "lucide-react";
import Link from "next/link";

export default function SanctionPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ loanId: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(""), 3000); };

  useEffect(() => {
    const u = localStorage.getItem("lms_user");
    if (!u) { router.replace("/auth/login"); return; }
    const parsed = JSON.parse(u);
    if (!["admin","sanction"].includes(parsed.role)) { router.replace("/dashboard"); return; }
    setUser(parsed);
    fetchLoans();
  }, [router]);

  const fetchLoans = () => {
    api.get("/dashboard/sanction/loans")
      .then(r => setLoans(r.data.data.loans))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const approve = async (id: string) => {
    setActionLoading(id);
    try {
      await api.patch(`/dashboard/sanction/loans/${id}/approve`);
      showToast("Loan sanctioned successfully");
      fetchLoans();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      showToast(e.response?.data?.message || "Failed to approve");
    } finally { setActionLoading(null); }
  };

  const reject = async () => {
    if (!rejectModal || !rejectReason.trim()) return;
    setActionLoading(rejectModal.loanId);
    try {
      await api.patch(`/dashboard/sanction/loans/${rejectModal.loanId}/reject`, { reason: rejectReason });
      showToast("Loan rejected");
      setRejectModal(null); setRejectReason("");
      fetchLoans();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      showToast(e.response?.data?.message || "Failed to reject");
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
              <ShieldCheck className="w-5 h-5 text-amber-400" /> Sanction Module
            </h1>
            <p className="text-zinc-500 text-sm mt-0.5">Review and approve or reject loan applications</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : loans.length === 0 ? (
          <div className="bg-surface-card border border-surface-border rounded-xl py-16 text-center animate-fade-up">
            <ShieldCheck className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500">No loans pending sanction</p>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-up animate-delay-100">
            {loans.map((loan) => {
              const borrower = loan.borrower as User;
              return (
                <div key={loan._id} className="bg-surface-card border border-surface-border rounded-xl p-6 hover:border-zinc-600 transition-all">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-semibold text-zinc-100">{formatCurrency(loan.loanAmount)}</span>
                        <Badge status={loan.status} />
                      </div>
                      <p className="text-sm text-zinc-400 mb-3">
                        {typeof borrower === "object" ? `${borrower.name} • ${borrower.email}` : ""}
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                        {[
                          ["Full Name", loan.fullName],
                          ["PAN", loan.pan],
                          ["Tenure", `${loan.tenure} days`],
                          ["Total Repayment", formatCurrency(loan.totalRepayment)],
                          ["Monthly Salary", formatCurrency(loan.monthlySalary)],
                          ["Employment", loan.employmentMode.replace("_"," ")],
                          ["Applied", formatDate(loan.createdAt)],
                        ].map(([l, v]) => (
                          <div key={l}>
                            <p className="text-zinc-500 text-xs">{l}</p>
                            <p className="text-zinc-200 font-medium capitalize">{v}</p>
                          </div>
                        ))}
                        {loan.salarySlipUrl && (
                          <div>
                            <p className="text-zinc-500 text-xs">Salary Slip</p>
                            <a href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}${loan.salarySlipUrl}`}
                              target="_blank" rel="noreferrer"
                              className="text-brand-400 hover:text-brand-300 text-sm flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5" /> View
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <Button variant="success" onClick={() => approve(loan._id)}
                        loading={actionLoading === loan._id} size="sm">
                        <CheckCircle2 className="w-4 h-4" /> Approve
                      </Button>
                      <Button variant="danger" onClick={() => { setRejectModal({ loanId: loan._id }); setRejectReason(""); }}
                        size="sm">
                        <XCircle className="w-4 h-4" /> Reject
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-card border border-surface-border rounded-2xl p-6 w-full max-w-md animate-fade-up">
            <h3 className="font-semibold text-zinc-100 mb-1">Reject Loan</h3>
            <p className="text-sm text-zinc-500 mb-4">Please provide a reason for rejection</p>
            <textarea
              className="w-full px-3.5 py-2.5 rounded-lg bg-surface border border-surface-border text-zinc-100 placeholder:text-zinc-600 text-sm outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 resize-none"
              rows={3} placeholder="e.g. Insufficient income documentation..."
              value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex gap-3 mt-4">
              <Button variant="secondary" onClick={() => setRejectModal(null)} className="flex-1">Cancel</Button>
              <Button variant="danger" onClick={reject} loading={!!actionLoading} disabled={!rejectReason.trim()} className="flex-1">
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
