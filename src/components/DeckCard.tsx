import { ChevronRight, Layers } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ProgressBar } from "./ui/ProgressBar";

export interface DeckCardStats {
  id: string;
  name: string;
  description: string;
  total: number;
  due: number;
  learned: number;
}

export function DeckCard({ id, name, description, total, due, learned }: DeckCardStats) {
  const navigate = useNavigate();
  const progress = total > 0 ? (learned / total) * 100 : 0;
  return (
    <button
      onClick={() => navigate(`/deck/${id}`)}
      className="kotoba-fade-up group flex w-full flex-col gap-3 rounded-2xl border border-black/5 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-white/[0.04] amoled:border-white/10 amoled:bg-zinc-950"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-lavender-100 text-lavender-600 dark:bg-lavender-500/15 dark:text-lavender-300">
            <Layers className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-zinc-900 dark:text-white">{name}</h3>
            <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{description || `${total} cards`}</p>
          </div>
        </div>
        <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-zinc-300 transition group-hover:translate-x-0.5 group-hover:text-lavender-500" />
      </div>
      <div className="flex items-center gap-3">
        <ProgressBar value={progress} className="flex-1" />
        <span className="shrink-0 text-xs font-medium text-zinc-500 dark:text-zinc-400">{Math.round(progress)}%</span>
      </div>
      <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
        <span>{total} cards</span>
        <span className={due > 0 ? "font-semibold text-lavender-600 dark:text-lavender-300" : ""}>{due} due</span>
      </div>
    </button>
  );
}
