import { useMemo, useState } from "react";
import { Flame, Clock3, BookCheck, Layers, History as HistoryIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Shell } from "../components/Shell";
import { TopBar } from "../components/ui/TopBar";
import { StatCard } from "../components/ui/StatCard";
import { BarChart } from "../components/ui/BarChart";
import { ProgressBar } from "../components/ui/ProgressBar";
import { useAllCards, useDecks, useReviews, useSessions, deckStats } from "../hooks/useKotobaData";
import { useSettings } from "../context/SettingsContext";
import { activityByDay, formatDuration, lastNDays, ratingBreakdown, totalStudyTimeMs } from "../lib/statsUtils";

export default function Statistics() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const cards = useAllCards() ?? [];
  const decks = useDecks() ?? [];
  const reviews = useReviews() ?? [];
  const sessions = useSessions() ?? [];
  const [range, setRange] = useState<7 | 30>(7);

  const overall = useMemo(() => deckStats(cards), [cards]);
  const days = useMemo(() => lastNDays(range), [range]);
  const activity = useMemo(() => activityByDay(reviews, days), [reviews, days]);
  const breakdown = useMemo(() => ratingBreakdown(reviews), [reviews]);
  const totalTime = useMemo(() => totalStudyTimeMs(sessions), [sessions]);
  const breakdownTotal = breakdown.again + breakdown.hard + breakdown.good + breakdown.easy || 1;

  return (
    <Shell>
      <TopBar
        title="Statistics"
        showBack={false}
        right={
          <button
            onClick={() => navigate("/history")}
            aria-label="View history"
            className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/10"
          >
            <HistoryIcon className="h-5 w-5" />
          </button>
        }
      />
      <div className="flex flex-col gap-6 px-5 py-5 pb-10">
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Total Cards" value={overall.total} icon={Layers} />
          <StatCard label="Learned" value={overall.learned} icon={BookCheck} accent="text-emerald-500" />
          <StatCard label="Reviews" value={reviews.length} icon={Clock3} accent="text-lavender-500" />
          <StatCard label="Current Streak" value={`${settings.currentStreak}d`} icon={Flame} accent="text-orange-500" />
        </div>

        <div className="rounded-2xl border border-black/5 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Activity</h2>
            <div className="flex rounded-full bg-zinc-100 p-0.5 text-xs dark:bg-white/10">
              {[7, 30].map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r as 7 | 30)}
                  className={`rounded-full px-2.5 py-1 font-medium transition ${
                    range === r ? "bg-white text-lavender-700 shadow dark:bg-zinc-900 dark:text-lavender-300" : "text-zinc-500"
                  }`}
                >
                  {r}d
                </button>
              ))}
            </div>
          </div>
          <BarChart
            labels={days}
            values={activity}
            formatLabel={(label) => {
              const d = new Date(label + "T00:00:00");
              return range === 7 ? d.toLocaleDateString(undefined, { weekday: "narrow" }) : d.getDate().toString();
            }}
          />
        </div>

        <div className="rounded-2xl border border-black/5 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]">
          <h2 className="mb-3 text-sm font-semibold text-zinc-800 dark:text-zinc-100">Review Breakdown</h2>
          <div className="flex flex-col gap-2.5">
            <BreakdownRow label="Again" value={breakdown.again} total={breakdownTotal} color="bg-rose-500" />
            <BreakdownRow label="Hard" value={breakdown.hard} total={breakdownTotal} color="bg-amber-500" />
            <BreakdownRow label="Good" value={breakdown.good} total={breakdownTotal} color="bg-lavender-500" />
            <BreakdownRow label="Easy" value={breakdown.easy} total={breakdownTotal} color="bg-emerald-500" />
          </div>
        </div>

        <div className="rounded-2xl border border-black/5 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]">
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-semibold text-zinc-800 dark:text-zinc-100">Total Study Time</span>
            <span className="text-zinc-500 dark:text-zinc-400">{formatDuration(totalTime)}</span>
          </div>
          <p className="text-xs text-zinc-400">Longest streak: {settings.longestStreak} days</p>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Deck Progress</h2>
          {decks.map((d) => {
            const s = deckStats(cards.filter((c) => c.deckId === d.id));
            const pct = s.total > 0 ? (s.learned / s.total) * 100 : 0;
            return (
              <div key={d.id} className="rounded-2xl border border-black/5 bg-white p-3.5 dark:border-white/10 dark:bg-white/[0.04]">
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium text-zinc-800 dark:text-zinc-100">{d.name}</span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">{s.learned}/{s.total}</span>
                </div>
                <ProgressBar value={pct} />
              </div>
            );
          })}
        </div>
      </div>
    </Shell>
  );
}

function BreakdownRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = (value / total) * 100;
  return (
    <div className="flex items-center gap-3">
      <span className="w-12 text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/5">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-6 text-right text-xs font-semibold text-zinc-600 dark:text-zinc-300">{value}</span>
    </div>
  );
}
