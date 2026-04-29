"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import Navbar from "@/components/ui/Navbar";
import { User } from "@/types";
import { formatDate } from "@/lib/utils";
import { Users, Mail, ArrowLeft, UserPlus } from "lucide-react";
import Link from "next/link";

interface Lead { _id: string; name: string; email: string; createdAt: string; }

export default function SalesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = localStorage.getItem("lms_user");
    const role = localStorage.getItem("lms_role");
    if (!u) { router.replace("/auth/login"); return; }
    const parsed = JSON.parse(u);
    if (!["admin","sales"].includes(parsed.role)) { router.replace("/dashboard"); return; }
    setUser(parsed);
    api.get("/dashboard/sales/leads")
      .then(r => setLeads(r.data.data.leads))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <div className="min-h-screen bg-surface">
      <Navbar userName={user?.name} role={user?.role} />
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center gap-4 mb-8 animate-fade-up">
          <Link href="/dashboard" className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-zinc-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" /> Sales — Lead Tracker
            </h1>
            <p className="text-zinc-500 text-sm mt-0.5">Registered users who haven&apos;t applied yet</p>
          </div>
        </div>

        <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden animate-fade-up animate-delay-100">
          <div className="px-6 py-4 border-b border-surface-border flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-400">{leads.length} lead{leads.length !== 1 ? "s" : ""}</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : leads.length === 0 ? (
            <div className="py-16 text-center">
              <UserPlus className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500">No pending leads. All users have applied!</p>
            </div>
          ) : (
            <div className="divide-y divide-surface-border">
              {leads.map((lead) => (
                <div key={lead._id} className="px-6 py-4 flex items-center justify-between hover:bg-surface-hover transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-sm font-semibold">
                      {lead.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-zinc-200 text-sm">{lead.name}</p>
                      <p className="text-xs text-zinc-500 flex items-center gap-1">
                        <Mail className="w-3 h-3" />{lead.email}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-zinc-500">Registered</span>
                    <p className="text-xs text-zinc-400">{formatDate(lead.createdAt)}</p>
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
