import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PartyPopper, Sparkles, Clock3, X } from "lucide-react";
import { Shell } from "../components/Shell";
import { SwipeCard } from "../components/SwipeCard";
import { ReviewButtons } from "../components/ReviewButtons";
import { ProgressBar } from "../components/ui/ProgressBar";
import { EmptyState } from "../components/ui/EmptyState";
import { useSettings } from "../context/SettingsContext";
import { getAllCards, getDeck, startSession, submitReview, endSession } from "../db/repository";
import type { Deck, Rating, StudySession, VocabCard } from "../db/types";
import { formatDuration } from "../lib/statsUtils";

type Phase = "loading" | "ready" | "active" | "complete" | "empty";

export default function LearnSession() {
  const { deckId = "all" } = useParams();
  const navigate = useNavigate();
  const { settings } = useSettings();

  const [phase, setPhase] = useState<Phase>("loading");
  const [deck, setDeck] = useState<Deck | null>(null);
  const [queue, setQueue] = useState<string[]>([]);
  const [cardsById, setCardsById] = useState<Record<string, VocabCard>>({});
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [session, setSession] = useState<StudySession | null>(null);
  const [initialTotal, setInitialTotal] = useState(0);
  const skippedOnce = useRef<Set<string>>(new Set());
  const [dueCount, setDueCount] = useState(0);
  const [newCount, setNewCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setPhase("loading");
      const now = Date.now();
      const all = await getAllCards();
      let scoped: VocabCard[];
      let title: Deck | null = null;
      if (deckId === "all") {
        scoped = all;
      } else if (deckId === "favorites") {
        scoped = all.filter((c) => c.isFavorite);
      } else {
        scoped = all.filter((c) => c.deckId === deckId);
        title = (await getDeck(deckId)) ?? null;
      }

      const due = scoped.filter((c) => c.nextReview <= now && c.state !== "new");
      const newOnes = scoped
        .filter((c) => c.state === "new")
        .slice(0, Math.max(0, settings.newCardsPerDay));

      due.sort((a, b) => a.nextReview - b.nextReview);
      const ordered = [...due, ...newOnes];

      if (cancelled) return;
      const map: Record<string, VocabCard> = {};
      ordered.forEach((c) => (map[c.id] = c));
      setCardsById(map);
      setQueue(ordered.map((c) => c.id));
      setDeck(title);
      setDueCount(due.length);
      setNewCount(newOnes.length);
      setInitialTotal(ordered.length);
      setIndex(0);
      setRevealed(false);
      skippedOnce.current = new Set();
      setPhase(ordered.length === 0 ? "empty" : "ready");
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId]);

  const currentCard = queue[index] ? cardsById[queue[index]] : undefined;
  const completed = session ? session.cardsReviewed : 0;
  const progressPct = initialTotal > 0 ? Math.min(100, (completed / initialTotal) * 100) : 0;

  async function handleStart() {
    const s = await startSession();
    setSession(s);
    setPhase("active");
  }

  async function finishSession(activeSession: StudySession) {
    await endSession(activeSession);
    setPhase("complete");
  }

  async function handleRate(rating: Rating) {
    if (!currentCard || !session) return;
    const updated = await submitReview(currentCard, rating, session);
    setSession({ ...session });
    setCardsById((prev) => ({ ...prev, [updated.id]: updated }));

    // Requeue cards that will be due again within the next 30 minutes (learning steps)
    const soon = updated.nextReview - Date.now() < 30 * 60 * 1000;
    setQueue((prev) => {
      const rest = prev.slice(index + 1);
      if (rating === "again" && soon) {
        return [...rest, updated.id];
      }
      return rest;
    });
    setIndex(0);
    setRevealed(false);

    const nextRemaining = queue.slice(index + 1).length + (rating === "again" && soon ? 1 : 0);
    if (nextRemaining === 0) {
      await finishSession({ ...session, cardsReviewed: session.cardsReviewed });
    }
  }

  async function handleSkip() {
    if (!currentCard || !session) return;
    const alreadySkipped = skippedOnce.current.has(currentCard.id);
    setQueue((prev) => {
      const rest = prev.slice(index + 1);
      if (!alreadySkipped) {
        skippedOnce.current.add(currentCard.id);
        return [...rest, currentCard.id];
      }
      return rest;
    });
    setIndex(0);
    setRevealed(false);
    const remaining = queue.slice(index + 1).length + (!alreadySkipped ? 1 : 0);
    if (remaining === 0) {
      await finishSession(session);
    }
  }

  const title = deckId === "all" ? "All Decks" : deckId === "favorites" ? "Favorites" : deck?.name ?? "Deck";

  if (phase === "loading") {
    return (
      <Shell withNav={false}>
        <div className="flex h-full items-center justify-center text-sm text-zinc-400">Loading...</div>
      </Shell>
    );
  }

  if (phase === "empty") {
    return (
      <Shell withNav={false}>
        <SessionTopBar title={title} onClose={() => navigate(-1)} />
        <div className="px-5 py-10">
          <EmptyState
            icon={PartyPopper}
            title="You're all caught up 🎉"
            description="There are no cards due right now. Great job staying on track!"
            action={
              <button
                onClick={() => navigate("/")}
                className="min-h-[48px] rounded-2xl bg-lavender-600 px-5 text-sm font-semibold text-white hover:bg-lavender-700"
              >
                Back to Home
              </button>
            }
          />
        </div>
      </Shell>
    );
  }

  if (phase === "ready") {
    const estMinutes = Math.max(1, Math.round((initialTotal * 12) / 60));
    return (
      <Shell withNav={false}>
        <SessionTopBar title={title} onClose={() => navigate(-1)} />
        <div className="flex flex-col items-center gap-8 px-6 py-12 text-center">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Ready to learn?</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Take your time — Kotoba will remember for you.</p>
          </div>
          <div className="grid w-full grid-cols-3 gap-3">
            <ReadyStat label="Due" value={dueCount} />
            <ReadyStat label="New" value={newCount} />
            <ReadyStat label="Estimated" value={`~${estMinutes} min`} icon={<Clock3 className="h-4 w-4" />} />
          </div>
          <button
            onClick={handleStart}
            className="min-h-[56px] w-full rounded-2xl bg-gradient-to-r from-lavender-600 to-lavender-500 text-base font-semibold text-white shadow-lg shadow-lavender-500/30 hover:brightness-105"
          >
            Start
          </button>
        </div>
      </Shell>
    );
  }

  if (phase === "complete" && session) {
    const timeSpent = (session.endedAt ?? Date.now()) - session.startedAt;
    return (
      <Shell withNav={false}>
        <SessionTopBar title={title} onClose={() => navigate("/")} />
        <div className="flex flex-col items-center gap-8 px-6 py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-lavender-100 text-lavender-600 dark:bg-lavender-500/15 dark:text-lavender-300">
            <Sparkles className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Session Complete 🎉</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Nicely done — see you next time.</p>
          </div>
          <div className="grid w-full grid-cols-2 gap-3">
            <ReadyStat label="Reviewed" value={session.cardsReviewed} />
            <ReadyStat label="Time Spent" value={formatDuration(timeSpent)} />
            <ReadyStat label="Again" value={session.again} accent="text-rose-500" />
            <ReadyStat label="Hard" value={session.hard} accent="text-amber-500" />
            <ReadyStat label="Good" value={session.good} accent="text-lavender-500" />
            <ReadyStat label="Easy" value={session.easy} accent="text-emerald-500" />
          </div>
          <button
            onClick={() => navigate("/")}
            className="min-h-[56px] w-full rounded-2xl bg-lavender-600 text-base font-semibold text-white shadow-lg shadow-lavender-500/30 hover:bg-lavender-700"
          >
            Done
          </button>
        </div>
      </Shell>
    );
  }

  if (!currentCard) return null;

  return (
    <Shell withNav={false}>
      <SessionTopBar title={title} subtitle={`${completed} / ${initialTotal}`} onClose={() => navigate(-1)} />
      <div className="flex flex-col gap-6 px-5 pb-6 pt-4">
        <ProgressBar value={progressPct} />
        <SwipeCard
          key={currentCard.id}
          card={currentCard}
          deckLanguage={deck?.language ?? "Japanese"}
          revealed={revealed}
          onReveal={() => setRevealed(true)}
          onRate={handleRate}
          onSkip={handleSkip}
          ttsEnabled={settings.ttsEnabled}
        />
        <ReviewButtons card={currentCard} onRate={handleRate} disabled={!revealed} />
        {!revealed && (
          <button
            onClick={() => setRevealed(true)}
            className="min-h-[48px] rounded-2xl border border-lavender-200 text-sm font-semibold text-lavender-600 dark:border-lavender-500/30 dark:text-lavender-300"
          >
            Tap to reveal answer
          </button>
        )}
      </div>
    </Shell>
  );
}

function SessionTopBar({ title, subtitle, onClose }: { title: string; subtitle?: string; onClose: () => void }) {
  return (
    <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-black/5 bg-white/80 px-4 py-3.5 backdrop-blur-lg dark:border-white/5 dark:bg-zinc-950/80">
      <button
        onClick={onClose}
        aria-label="Close session"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/10"
      >
        <X className="h-5 w-5" />
      </button>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-semibold text-zinc-900 dark:text-white">{title}</h1>
        {subtitle && <p className="text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</p>}
      </div>
    </div>
  );
}

function ReadyStat({ label, value, accent = "text-zinc-900 dark:text-white", icon }: { label: string; value: number | string; accent?: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl border border-black/5 bg-white py-4 dark:border-white/10 dark:bg-white/[0.04]">
      <span className={`flex items-center gap-1 text-xl font-bold ${accent}`}>
        {icon}
        {value}
      </span>
      <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">{label}</span>
    </div>
  );
}
