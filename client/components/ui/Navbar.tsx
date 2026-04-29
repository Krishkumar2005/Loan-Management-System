"use client";
import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";

export default function Navbar({ userName, role }: { userName?: string; role?: string }) {
  const router = useRouter();
  const handleLogout = () => {
    localStorage.removeItem("lms_token");
    localStorage.removeItem("lms_role");
    localStorage.removeItem("lms_user");
    router.replace("/auth/login");
  };
  return (
    <nav className="h-14 border-b border-surface-border bg-surface-card/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center text-white text-xs font-bold">L</div>
        <span className="font-semibold text-zinc-100 tracking-tight">LMS</span>
        {role && (
          <span className="px-2 py-0.5 text-xs bg-brand-500/10 text-brand-400 border border-brand-500/20 rounded-full capitalize ml-2">
            {role}
          </span>
        )}
      </div>
      <div className="flex items-center gap-4">
        {userName && (
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <User className="w-3.5 h-3.5" />
            {userName}
          </div>
        )}
        <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-red-400 transition-colors">
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
}
