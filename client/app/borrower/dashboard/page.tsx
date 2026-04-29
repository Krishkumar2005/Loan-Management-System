"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { Loan, User } from "@/types";
import Navbar from "@/components/ui/Navbar";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PlusCircle, FileText, TrendingUp, IndianRupee, Clock } from "lucide-react";

export default function BorrowerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = localStorage.getItem("lms_user");
    const role = localStorage.getItem("lms_role");
    if (!u || role !== "borrower") { router.replace("/auth/login"); return; }
    setUser(JSON.parse(u));
    fetchLoans();
  }, [router]);

  const fetchLoans = async () => {
    try {
      const res = await api.get("/loans/my-loans");
      setLoans(res.data.data.loans);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const activeLoans = loans.filter(l => ["applied","sanctioned","disbursed"].includes(l.status));
  const totalBorrowed = loans.filter(l => l.status !== "rejected").reduce((a, l) => a + l.loanAmount, 0);

  return (
    <div className="min-h-screen bg-surface">
      <Navbar userName={user?.name} role="Borrower" />
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 animate-fade-up">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-100">
              Hello, {user?.name?.split(" ")[0]} 👋
            </h1>
            <p className="text-zinc-500 text-sm mt-1">Here&apos;s an overview of your loan applications</p>
          </div>
          <Link href="/borrower/apply">
            <Button size="md">
              <PlusCircle className="w-4 h-4" /> Apply for Loan
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Applications", value: loans.length, icon: FileText, color: "brand" },
            { label: "Active Loans", value: activeLoans.length, icon: TrendingUp, color: "amber" },
            { label: "Total Borrowed", value: formatCurrency(totalBorrowed), icon: IndianRupee, color: "emerald" },
          ].map(({ label, value, icon: Icon, color }, i) => (
            <div key={label} className={`bg-surface-card border border-surface-border rounded-xl p-5 animate-fade-up animate-delay-${(i+1)*100}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-zinc-500">{label}</span>
                <div className={`w-8 h-8 rounded-lg bg-${color}-500/10 flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 text-${color}-400`} />
                </div>
              </div>
              <div className="text-2xl font-semibold text-zinc-100">{value}</div>
            </div>
          ))}
        </div>

        {/* Loans list */}
        <div className="animate-fade-up animate-delay-300">
          <h2 className="text-lg font-semibold text-zinc-200 mb-4">Your Applications</h2>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : loans.length === 0 ? (
            <div className="bg-surface-card border border-surface-border rounded-xl py-16 text-center">
              <FileText className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500 mb-4">No loan applications yet</p>
              <Link href="/borrower/apply">
                <Button><PlusCircle className="w-4 h-4" /> Apply Now</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {loans.map((loan) => (
                <div key={loan._id} className="bg-surface-card border border-surface-border rounded-xl p-5 hover:border-zinc-600 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold text-zinc-100">{formatCurrency(loan.loanAmount)}</span>
                        <Badge status={loan.status} />
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-zinc-500">
                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{loan.tenure} days</span>
                        <span>Total repayment: {formatCurrency(loan.totalRepayment)}</span>
                        <span>Applied: {formatDate(loan.createdAt)}</span>
                      </div>
                      {loan.status === "rejected" && loan.rejectionReason && (
                        <div className="mt-2 text-xs text-red-400 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20">
                          Rejection reason: {loan.rejectionReason}
                        </div>
                      )}
                      {loan.status === "disbursed" && (
                        <div className="mt-2 flex gap-4 text-sm">
                          <span className="text-emerald-400">Paid: {formatCurrency(loan.totalPaid)}</span>
                          <span className="text-zinc-400">Outstanding: {formatCurrency(loan.outstandingBalance)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
