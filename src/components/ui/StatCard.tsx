import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon?: LucideIcon;
  accent?: string;
}

export function StatCard({ label, value, icon: Icon, accent = "text-lavender-500" }: StatCardProps) {
  return (
    <div className="kotoba-fade-up flex flex-col gap-2 rounded-2xl border border-black/5 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04] amoled:border-white/10 amoled:bg-zinc-950">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{label}</span>
        {Icon && <Icon className={`h-4 w-4 ${accent}`} />}
      </div>
      <span className="text-2xl font-semibold text-zinc-900 dark:text-white">{value}</span>
    </div>
  );
}
