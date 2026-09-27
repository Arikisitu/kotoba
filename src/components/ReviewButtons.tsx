import type { Rating } from "../db/types";
import { formatInterval, scheduleCard } from "../db/scheduler";
import type { VocabCard } from "../db/types";

interface ReviewButtonsProps {
  card: VocabCard;
  onRate: (rating: Rating) => void;
  disabled?: boolean;
}

const RATINGS: { key: Rating; label: string; classes: string }[] = [
  { key: "again", label: "Again", classes: "bg-rose-500/10 text-rose-600 dark:text-rose-300 hover:bg-rose-500/20" },
  { key: "hard", label: "Hard", classes: "bg-amber-500/10 text-amber-600 dark:text-amber-300 hover:bg-amber-500/20" },
  { key: "good", label: "Good", classes: "bg-lavender-500/10 text-lavender-700 dark:text-lavender-300 hover:bg-lavender-500/20" },
  { key: "easy", label: "Easy", classes: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-500/20" },
];

export function ReviewButtons({ card, onRate, disabled }: ReviewButtonsProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {RATINGS.map(({ key, label, classes }) => {
        const preview = scheduleCard(card, key);
        return (
          <button
            key={key}
            disabled={disabled}
            onClick={() => onRate(key)}
            className={`flex min-h-[56px] flex-col items-center justify-center gap-0.5 rounded-2xl text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${classes}`}
          >
            <span>{label}</span>
            <span className="text-[10px] font-normal opacity-70">{formatInterval(preview.interval)}</span>
          </button>
        );
      })}
    </div>
  );
}
