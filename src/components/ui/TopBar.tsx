import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

interface TopBarProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  showBack?: boolean;
  right?: ReactNode;
}

export function TopBar({ title, subtitle, onBack, showBack = true, right }: TopBarProps) {
  const navigate = useNavigate();
  return (
    <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-black/5 bg-white/80 px-4 py-3.5 backdrop-blur-lg dark:border-white/5 dark:bg-zinc-950/80 amoled:bg-black/90">
      {showBack && (
        <button
          onClick={() => (onBack ? onBack() : navigate(-1))}
          aria-label="Go back"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/10"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-semibold text-zinc-900 dark:text-white">{title}</h1>
        {subtitle && <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}
