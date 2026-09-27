import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Flame, Sparkles, GraduationCap, Layers, Plus } from "lucide-react";
import { Shell } from "../components/Shell";
import { StatCard } from "../components/ui/StatCard";
import { ProgressBar } from "../components/ui/ProgressBar";
import { DeckCard } from "../components/DeckCard";
import { EmptyState } from "../components/ui/EmptyState";
import { useSettings } from "../context/SettingsContext";
import { useAllCards, useDecks, useSessions, deckStats } from "../hooks/useKotobaData";
import { greetingForNow, todayReviewedCount } from "../lib/homeUtils";

export default function Home() {
  const { settings } = useSettings();
  const navigate = useNavigate();
  const decks = useDecks() ?? [];
  const cards = useAllCards() ?? [];
  const sessions = useSessions() ?? [];

  const now = Date.now();
  const { total, due, newCount, learned } = useMemo(() => deckStats(cards, now), [cards, now]);
  const reviewedToday = useMemo(() => todayReviewedCount(sessions), [sessions]);
  const goalProgress = settings.dailyGoal > 0 ? Math.min(100, (reviewedToday / settings.dailyGoal) * 100) : 0;
  const goalComplete = reviewedToday >= settings.dailyGoal && settings.dailyGoal > 0;

  const deckList = useMemo(
    () =>
      decks.map((d) => {
        const dCards = cards.filter((c) => c.deckId === d.id);
        const s = deckStats(dCards, now);
        return { deck: d, stats: s };
      }),
    [decks, cards, now]
  );

  return (
    <Shell>
      <div className="flex flex-col gap-6 px-5 pb-8 pt-6">
        <div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{greetingForNow()},</p>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{settings.name || "Learner"}</h1>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Today's Review" value={due} icon={GraduationCap} />
          <StatCard label="New Words" value={Math.min(newCount, settings.newCardsPerDay)} icon={Sparkles} accent="text-amber-500" />
          <StatCard label="Learned" value={learned} icon={Layers} accent="text-emerald-500" />
          <StatCard label="Streak" value={`${settings.currentStreak}d`} icon={Flame} accent="text-orange-500" />
        </div>

        <button
          onClick={() => navigate(total > 0 ? "/learn" : "/library")}
          className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-lavender-600 to-lavender-500 text-base font-semibold text-white shadow-lg shadow-lavender-500/30 transition hover:brightness-105"
        >
          <GraduationCap className="h-5 w-5" />
          Start Learning
        </button>

        <div className="rounded-2xl border border-black/5 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04] amoled:border-white/10 amoled:bg-zinc-950">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Today's Goal</span>
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {reviewedToday} / {settings.dailyGoal}
            </span>
          </div>
          <ProgressBar value={goalProgress} />
          {goalComplete && <p className="mt-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">Today's goal complete 🎉</p>}
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-white">Your Decks</h2>
            <button
              onClick={() => navigate("/createDeck")}
              className="flex items-center gap-1 text-sm font-medium text-lavender-600 dark:text-lavender-300"
            >
              <Plus className="h-4 w-4" /> New
            </button>
          </div>
          {deckList.length === 0 ? (
            <EmptyState
              icon={Layers}
              title="Your vocabulary library is empty."
              description="Create your first deck to start learning with Kotoba."
              action={
                <button
                  onClick={() => navigate("/createDeck")}
                  className="min-h-[48px] rounded-2xl bg-lavender-600 px-5 text-sm font-semibold text-white hover:bg-lavender-700"
                >
                  Create your first deck
                </button>
              }
            />
          ) : (
            <div className="flex flex-col gap-3">
              {deckList.map(({ deck, stats }) => (
                <DeckCard
                  key={deck.id}
                  id={deck.id}
                  name={deck.name}
                  description={deck.description}
                  total={stats.total}
                  due={stats.due}
                  learned={stats.learned}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
