import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Layers, Star, GraduationCap } from "lucide-react";
import { Shell } from "../components/Shell";
import { TopBar } from "../components/ui/TopBar";
import { EmptyState } from "../components/ui/EmptyState";
import { useAllCards, useDecks, deckStats, useFavoriteCards } from "../hooks/useKotobaData";

export default function LearnPicker() {
  const navigate = useNavigate();
  const decks = useDecks() ?? [];
  const cards = useAllCards() ?? [];
  const favorites = useFavoriteCards();
  const now = Date.now();

  const overall = useMemo(() => deckStats(cards, now), [cards, now]);
  const favDue = favorites.filter((c) => c.nextReview <= now).length;

  if (decks.length === 0) {
    return (
      <Shell>
        <TopBar title="Learn" showBack={false} />
        <div className="px-5 py-6">
          <EmptyState
            icon={GraduationCap}
            title="Nothing to learn yet"
            description="Create a deck and add some vocabulary to start your first review session."
            action={
              <button
                onClick={() => navigate("/createDeck")}
                className="min-h-[48px] rounded-2xl bg-lavender-600 px-5 text-sm font-semibold text-white hover:bg-lavender-700"
              >
                Create your first deck
              </button>
            }
          />
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <TopBar title="Learn" showBack={false} />
      <div className="flex flex-col gap-4 px-5 py-5">
        <button
          onClick={() => navigate("/learn/all")}
          className="flex items-center gap-3 rounded-2xl border border-lavender-200 bg-lavender-50 p-4 text-left shadow-sm transition hover:-translate-y-0.5 dark:border-lavender-500/20 dark:bg-lavender-500/10"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-lavender-600 text-white">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-zinc-900 dark:text-white">All Decks</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{overall.due} due · {overall.newCount} new</p>
          </div>
        </button>

        {favorites.length > 0 && (
          <button
            onClick={() => navigate("/learn/favorites")}
            className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left shadow-sm transition hover:-translate-y-0.5 dark:border-amber-500/20 dark:bg-amber-500/10"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500 text-white">
              <Star className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-zinc-900 dark:text-white">Favorites Only</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{favDue} due · {favorites.length} total</p>
            </div>
          </button>
        )}

        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">Or pick a deck</p>
        <div className="flex flex-col gap-3">
          {decks.map((deck) => {
            const dCards = cards.filter((c) => c.deckId === deck.id);
            const s = deckStats(dCards, now);
            return (
              <button
                key={deck.id}
                onClick={() => navigate(`/learn/${deck.id}`)}
                className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/[0.04]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-lavender-100 text-lavender-600 dark:bg-lavender-500/15 dark:text-lavender-300">
                  <Layers className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-zinc-900 dark:text-white">{deck.name}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {s.due} due · {s.newCount} new · {s.total} total
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </Shell>
  );
}
