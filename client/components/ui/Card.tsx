import { cn } from "@/lib/utils";
export default function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-surface-card border border-surface-border rounded-xl p-6", className)}>
      {children}
    </div>
  );
}
