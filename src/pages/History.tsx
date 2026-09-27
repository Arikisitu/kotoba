import { useMemo, useState } from "react";
import { ChevronDown, Clock3, History as HistoryIcon } from "lucide-react";
import { Shell } from "../components/Shell";
import { TopBar } from "../components/ui/TopBar";
import { EmptyState } from "../components/ui/EmptyState";
import { useAllCards, useReviews, useSessions } from "../hooks/useKotobaData";
import { formatDayLabel, formatDuration } from "../lib/statsUtils";

export default function History() {
  const sessions = useSessions() ?? [];
  const reviews = useReviews() ?? [];
  const cards = useAllCards() ?? [];
  const [openDay, setOpenDay] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, { cards: number; time: number }>();
    for (const s of sessions) {
      const entry = map.get(s.date) ?? { cards: 0, time: 0 };
      entry.cards += s.cardsReviewed;
      entry.time += Math.max(0, (s.endedAt ?? s.startedAt) - s.startedAt);
      map.set(s.date, entry);
    }
    return Array.from(map.entries())
      .filter(([, v]) => v.cards > 0)
      .sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [sessions]);

  const cardById = useMemo(() => {
    const m = new Map(cards.map((c) => [c.id, c]));
    return m;
  }, [cards]);

  function reviewsForDay(date: string) {
    return reviews.filter((r) => new Date(r.reviewedAt).toISOString().slice(0, 10) === date);
  }

  return (
    <Shell>
      <TopBar title="History" showBack={false} />
      <div className="flex flex-col gap-3 px-5 py-5 pb-10">
        {grouped.length === 0 ? (
          <EmptyState icon={HistoryIcon} title="No study history yet" description="Complete a review session to see it appear here." />
        ) : (
          grouped.map(([date, info]) => {
            const isOpen = openDay === date;
            const dayReviews = isOpen ? reviewsForDay(date) : [];
            return (
              <div key={date} className="overflow-hidden rounded-2xl border border-black/5 bg-white dark:border-white/10 dark:bg-white/[0.04]">
                <button
                  onClick={() => setOpenDay(isOpen ? null : date)}
                  className="flex w-full items-center justify-between p-4 text-left"
                >
                  <div>
                    <p className="font-semibold text-zinc-900 dark:text-white">{formatDayLabel(date)}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {info.cards} cards · {formatDuration(info.time)}
                    </p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && (
                  <div className="flex flex-col gap-1.5 border-t border-black/5 p-3 dark:border-white/10">
                    {dayReviews.length === 0 ? (
                      <p className="p-2 text-xs text-zinc-400">No detailed logs for this day.</p>
                    ) : (
                      dayReviews.map((r) => {
                        const c = cardById.get(r.cardId);
                        return (
                          <div key={r.id} className="flex items-center justify-between rounded-xl px-2 py-1.5 text-sm">
                            <span className="truncate text-zinc-700 dark:text-zinc-200">{c?.front ?? "(deleted card)"}</span>
                            <span className="flex items-center gap-1 text-xs text-zinc-400">
                              <Clock3 className="h-3 w-3" />
                              {new Date(r.reviewedAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                              <RatingPill rating={r.rating} />
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </Shell>
  );
}

function RatingPill({ rating }: { rating: string }) {
  const colors: Record<string, string> = {
    again: "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
    hard: "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
    good: "bg-lavender-100 text-lavender-700 dark:bg-lavender-500/15 dark:text-lavender-300",
    easy: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
  };
  return <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold capitalize ${colors[rating]}`}>{rating}</span>;
}
