"use client";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export default function Button({
  children, className, variant = "primary", size = "md",
  loading, disabled, ...props
}: ButtonProps) {
  const base = "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed select-none";
  const variants = {
    primary:   "bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-900/40 hover:shadow-brand-800/50",
    secondary: "bg-surface-card border border-surface-border hover:border-brand-500/50 text-zinc-200 hover:text-white",
    ghost:     "text-zinc-400 hover:text-white hover:bg-white/5",
    danger:    "bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 hover:text-red-300",
    success:   "bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300",
  };
  const sizes = {
    sm: "text-sm px-3 py-1.5",
    md: "text-sm px-4 py-2.5",
    lg: "text-base px-6 py-3",
  };
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} disabled={disabled || loading} {...props}>
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}
