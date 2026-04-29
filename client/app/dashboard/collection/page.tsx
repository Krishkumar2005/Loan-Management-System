"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import Navbar from "@/components/ui/Navbar";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Loan, User } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { HandCoins, ArrowLeft, PlusCircle, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function CollectionPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [paymentForms, setPaymentForms] = useState<Record<string, { utrNumber: string; amount: string; date: string }>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(""), 4000); };

  useEffect(() => {
    const u = localStorage.getItem("lms_user");
    if (!u) { router.replace("/auth/login"); return; }
    const parsed = JSON.parse(u);
    if (!["admin","collection"].includes(parsed.role)) { router.replace("/dashboard"); return; }
    setUser(parsed);
    fetchLoans();
  }, [router]);

  const fetchLoans = () => {
    api.get("/dashboard/collection/loans")
      .then(r => setLoans(r.data.data.loans))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const toggleExpand = (id: string) => {
    setExpanded(expanded === id ? null : id);
    if (!paymentForms[id]) {
      setPaymentForms(prev => ({
        ...prev,
        [id]: { utrNumber: "", amount: "", date: new Date().toISOString().split("T")[0] }
      }));
    }
  };

  const updateForm = (id: string, field: string, value: string) => {
    setPaymentForms(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
    setErrors(prev => ({ ...prev, [id]: "" }));
  };

  const recordPayment = async (loanId: string) => {
    const form = paymentForms[loanId];
    if (!form?.utrNumber || !form?.amount || !form?.date) {
      setErrors(prev => ({ ...prev, [loanId]: "All fields are required" }));
      return;
    }
    setSubmitting(loanId);
    try {
      const res = await api.post(`/dashboard/collection/loans/${loanId}/payment`, {
        utrNumber: form.utrNumber,
        amount: Number(form.amount),
        date: form.date,
      });
      showToast(res.data.message);
      setExpanded(null);
      setPaymentForms(prev => ({ ...prev, [loanId]: { utrNumber: "", amount: "", date: new Date().toISOString().split("T")[0] } }));
      fetchLoans();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setErrors(prev => ({ ...prev, [loanId]: e.response?.data?.message || "Payment failed" }));
    } finally { setSubmitting(null); }
  };

  const disbursed = loans.filter(l => l.status === "disbursed");
  const closed = loans.filter(l => l.status === "closed");

  return (
    <div className="min-h-screen bg-surface">
      <Navbar userName={user?.name} role={user?.role} />
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-surface-card border border-surface-border px-4 py-3 rounded-xl text-sm text-zinc-200 shadow-2xl animate-fade-up flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {toastMsg}
        </div>
      )}
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center gap-4 mb-8 animate-fade-up">
          <Link href="/dashboard" className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-zinc-100 flex items-center gap-2">
              <HandCoins className="w-5 h-5 text-emerald-400" /> Collection Module
            </h1>
            <p className="text-zinc-500 text-sm mt-0.5">Record borrower payments and track outstanding balances</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Active / Disbursed Loans */}
            <div>
              <h2 className="text-base font-semibold text-zinc-300 mb-3">Active Loans ({disbursed.length})</h2>
              {disbursed.length === 0 ? (
                <div className="bg-surface-card border border-surface-border rounded-xl py-10 text-center">
                  <p className="text-zinc-500">No active loans for collection</p>
                </div>
              ) : (
                <div className="space-y-3 animate-fade-up animate-delay-100">
                  {disbursed.map((loan) => {
                    const borrower = loan.borrower as User;
                    const isOpen = expanded === loan._id;
                    const form = paymentForms[loan._id];
                    const pct = Math.min(100, (loan.totalPaid / loan.totalRepayment) * 100);

                    return (
                      <div key={loan._id} className="bg-surface-card border border-surface-border rounded-xl overflow-hidden hover:border-zinc-600 transition-all">
                        <div className="p-5">
                          <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-zinc-100">{formatCurrency(loan.loanAmount)}</span>
                                <Badge status={loan.status} />
                              </div>
                              <p className="text-sm text-zinc-400">{typeof borrower === "object" ? `${borrower.name} — ${borrower.email}` : ""}</p>
                            </div>
                            <Button variant="secondary" size="sm" onClick={() => toggleExpand(loan._id)}>
                              <PlusCircle className="w-3.5 h-3.5" /> Record Payment
                              {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </Button>
                          </div>

                          {/* Progress bar */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs text-zinc-500">
                              <span>Paid: {formatCurrency(loan.totalPaid)}</span>
                              <span>Outstanding: {formatCurrency(loan.outstandingBalance)}</span>
                            </div>
                            <div className="h-2 bg-surface rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                            </div>
                            <div className="text-xs text-zinc-500 text-right">{pct.toFixed(1)}% of {formatCurrency(loan.totalRepayment)}</div>
                          </div>

                          {/* Payment history */}
                          {loan.payments.length > 0 && (
                            <div className="mt-4 border-t border-surface-border pt-3">
                              <p className="text-xs font-medium text-zinc-500 mb-2">Payment History</p>
                              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                                {loan.payments.map((p) => (
                                  <div key={p._id} className="flex items-center justify-between text-xs">
                                    <span className="text-zinc-400 font-mono">{p.utrNumber}</span>
                                    <span className="text-emerald-400 font-medium">{formatCurrency(p.amount)}</span>
                                    <span className="text-zinc-500">{formatDate(p.date)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Payment form */}
                        {isOpen && form && (
                          <div className="border-t border-surface-border bg-surface p-5 animate-fade-in">
                            <p className="text-sm font-medium text-zinc-300 mb-4">Record New Payment</p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <Input label="UTR Number" placeholder="UTR123456789" value={form.utrNumber}
                                onChange={(e) => updateForm(loan._id, "utrNumber", e.target.value)} required />
                              <Input label="Amount (₹)" type="number" placeholder="10000"
                                value={form.amount} onChange={(e) => updateForm(loan._id, "amount", e.target.value)}
                                hint={`Max: ${formatCurrency(loan.outstandingBalance)}`} required />
                              <Input label="Payment Date" type="date" value={form.date}
                                onChange={(e) => updateForm(loan._id, "date", e.target.value)} required />
                            </div>
                            {errors[loan._id] && (
                              <p className="text-sm text-red-400 mt-2">{errors[loan._id]}</p>
                            )}
                            <div className="flex gap-3 mt-4">
                              <Button variant="secondary" size="sm" onClick={() => toggleExpand(loan._id)}>Cancel</Button>
                              <Button size="sm" onClick={() => recordPayment(loan._id)} loading={submitting === loan._id}>
                                Record Payment
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Closed Loans */}
            {closed.length > 0 && (
              <div>
                <h2 className="text-base font-semibold text-zinc-300 mb-3">Closed Loans ({closed.length})</h2>
                <div className="space-y-3">
                  {closed.map((loan) => {
                    const borrower = loan.borrower as User;
                    return (
                      <div key={loan._id} className="bg-surface-card border border-surface-border rounded-xl p-5 opacity-70">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-zinc-300">{formatCurrency(loan.loanAmount)}</span>
                              <Badge status={loan.status} />
                            </div>
                            <p className="text-sm text-zinc-500">{typeof borrower === "object" ? borrower.name : ""}</p>
                          </div>
                          <div className="text-right text-sm">
                            <p className="text-emerald-400 font-medium">{formatCurrency(loan.totalPaid)} paid</p>
                            <p className="text-zinc-500 text-xs">Closed {formatDate(loan.closedAt || "")}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
