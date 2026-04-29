"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import Navbar from "@/components/ui/Navbar";
import { User } from "@/types";
import { Users, ShieldCheck, Banknote, HandCoins, LayoutDashboard, ChevronRight } from "lucide-react";

const MODULE_CONFIG: Record<string, { label: string; icon: React.ElementType; path: string; desc: string; color: string }> = {
  sales:        { label: "Sales",        icon: Users,          path: "/dashboard/sales",        desc: "Track leads and unregistered borrowers",  color: "blue" },
  sanction:     { label: "Sanction",     icon: ShieldCheck,    path: "/dashboard/sanction",     desc: "Review and approve loan applications",    color: "amber" },
  disbursement: { label: "Disbursement", icon: Banknote,       path: "/dashboard/disbursement", desc: "Release funds for approved loans",        color: "brand" },
  collection:   { label: "Collection",   icon: HandCoins,      path: "/dashboard/collection",   desc: "Record payments and close loans",         color: "emerald" },
};

const ROLE_MODULES: Record<string, string[]> = {
  admin:        ["sales", "sanction", "disbursement", "collection"],
  sales:        ["sales"],
  sanction:     ["sanction"],
  disbursement: ["disbursement"],
  collection:   ["collection"],
};

export default function DashboardHome() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    const u = localStorage.getItem("lms_user");
    const role = localStorage.getItem("lms_role");
    if (!u) { router.replace("/auth/login"); return; }
    if (role === "borrower") { router.replace("/borrower/dashboard"); return; }
    const parsed = JSON.parse(u);
    setUser(parsed);

    // Auto-redirect non-admin single-module roles
    if (role && role !== "admin" && ROLE_MODULES[role]?.length === 1) {
      router.replace(MODULE_CONFIG[ROLE_MODULES[role][0]].path);
      return;
    }

    if (role === "admin") {
      api.get("/dashboard/admin/stats").then(r => setStats(r.data.data)).catch(() => {});
    }
  }, [router]);

  const role = user?.role || "";
  const modules = ROLE_MODULES[role] || [];

  return (
    <div className="min-h-screen bg-surface">
      <Navbar userName={user?.name} role={role} />
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8 animate-fade-up">
          <div className="flex items-center gap-2 text-zinc-500 text-sm mb-1">
            <LayoutDashboard className="w-4 h-4" />
            <span>Operations Dashboard</span>
          </div>
          <h1 className="text-2xl font-semibold text-zinc-100">Welcome, {user?.name?.split(" ")[0]}</h1>
        </div>

        {/* Admin stats */}
        {role === "admin" && stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 animate-fade-up animate-delay-100">
            {[
              ["Total Borrowers", stats.totalBorrowers],
              ["Applied", stats.applied],
              ["Disbursed", stats.disbursed],
              ["Closed", stats.closed],
            ].map(([label, value]) => (
              <div key={label as string} className="bg-surface-card border border-surface-border rounded-xl p-4">
                <p className="text-xs text-zinc-500 mb-1">{label}</p>
                <p className="text-2xl font-bold text-zinc-100">{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Modules */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {modules.map((mod, i) => {
            const cfg = MODULE_CONFIG[mod];
            const Icon = cfg.icon;
            return (
              <Link key={mod} href={cfg.path}
                className={`group bg-surface-card border border-surface-border hover:border-zinc-600 rounded-xl p-6 flex items-start justify-between transition-all duration-200 hover:shadow-xl animate-fade-up`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-11 h-11 rounded-xl bg-${cfg.color}-500/10 border border-${cfg.color}-500/20 flex items-center justify-center shrink-0`}>
                    <Icon className={`w-5 h-5 text-${cfg.color}-400`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-100 mb-1">{cfg.label}</h3>
                    <p className="text-sm text-zinc-500">{cfg.desc}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400 transition-colors shrink-0 mt-1" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
