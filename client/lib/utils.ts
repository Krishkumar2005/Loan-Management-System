import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    applied: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    sanctioned: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    disbursed: "text-brand-400 bg-brand-400/10 border-brand-400/20",
    closed: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    rejected: "text-red-400 bg-red-400/10 border-red-400/20",
  };
  return map[status] || "text-zinc-400 bg-zinc-400/10 border-zinc-400/20";
}

export function calculateSI(principal: number, days: number, rate = 12): number {
  return (principal * rate * days) / (365 * 100);
}
