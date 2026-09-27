import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="kotoba-fade-up flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-zinc-300 px-6 py-14 text-center dark:border-white/15">
      {Icon && (
        <div className="mb-1 flex h-14 w-14 items-center justify-center rounded-2xl bg-lavender-100 text-lavender-600 dark:bg-lavender-500/10 dark:text-lavender-300">
          <Icon className="h-7 w-7" />
        </div>
      )}
      <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-100">{title}</h3>
      {description && <p className="max-w-xs text-sm text-zinc-500 dark:text-zinc-400">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
