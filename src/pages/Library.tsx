import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Star, Layers, Volume2 } from "lucide-react";
import { Shell } from "../components/Shell";
import { TopBar } from "../components/ui/TopBar";
import { SearchBar } from "../components/ui/SearchBar";
import { DeckCard } from "../components/DeckCard";
import { EmptyState } from "../components/ui/EmptyState";
import { TagChip } from "../components/ui/TagChip";
import { useAllCards, useDecks, deckStats } from "../hooks/useKotobaData";
import { speak } from "../lib/tts";
import { useToast } from "../context/ToastContext";

type Mode = "decks" | "cards";

export default function Library() {
  const navigate = useNavigate();
  const { show } = useToast();
  const decks = useDecks() ?? [];
  const cards = useAllCards() ?? [];
  const [mode, setMode] = useState<Mode>("decks");
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const now = Date.now();

  const allTags = useMemo(() => {
    const s = new Set<string>();
    cards.forEach((c) => c.tags.forEach((t) => s.add(t)));
    return Array.from(s).sort();
  }, [cards]);

  const filteredDecks = useMemo(
    () => decks.filter((d) => d.name.toLowerCase().includes(query.toLowerCase())),
    [decks, query]
  );

  const filteredCards = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cards.filter((c) => {
      const matchesTag = !activeTag || c.tags.includes(activeTag);
      if (!matchesTag) return false;
      if (!q) return true;
      return (
        c.front.toLowerCase().includes(q) ||
        c.back.toLowerCase().includes(q) ||
        c.reading.toLowerCase().includes(q) ||
        c.romaji.toLowerCase().includes(q) ||
        c.meaning.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [cards, query, activeTag]);

  return (
    <Shell>
      <TopBar title="Library" showBack={false} right={<button onClick={() => navigate("/favorites")} aria-label="Favorites" className="flex h-10 w-10 items-center justify-center rounded-full text-amber-500 hover:bg-zinc-100 dark:hover:bg-white/10"><Star className="h-5 w-5" /></button>} />
      <div className="flex flex-col gap-4 px-5 py-5 pb-24">
        <div className="flex rounded-2xl bg-zinc-200/60 p-1 dark:bg-white/5">
          {(["decks", "cards"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 rounded-xl py-2 text-sm font-semibold capitalize transition ${
                mode === m ? "bg-white text-lavender-700 shadow dark:bg-zinc-900 dark:text-lavender-300" : "text-zinc-500"
              }`}
            >
              {m === "decks" ? "Decks" : "Vocabulary"}
            </button>
          ))}
        </div>

        <SearchBar value={query} onChange={setQuery} placeholder={mode === "decks" ? "Search decks" : "Search vocabulary"} />

        {mode === "cards" && allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {allTags.map((t) => (
              <TagChip key={t} label={t} active={activeTag === t} onClick={() => setActiveTag(activeTag === t ? null : t)} />
            ))}
          </div>
        )}

        {mode === "decks" ? (
          filteredDecks.length === 0 ? (
            <EmptyState icon={Layers} title="No decks found" description="Try a different search or create a new deck." />
          ) : (
            <div className="flex flex-col gap-3">
              {filteredDecks.map((d) => {
                const stats = deckStats(cards.filter((c) => c.deckId === d.id), now);
                return (
                  <DeckCard key={d.id} id={d.id} name={d.name} description={d.description} total={stats.total} due={stats.due} learned={stats.learned} />
                );
              })}
            </div>
          )
        ) : filteredCards.length === 0 ? (
          <EmptyState icon={Layers} title="No matching vocabulary" description="Try searching a different word, reading, or tag." />
        ) : (
          <div className="flex flex-col gap-2">
            {filteredCards.map((c) => (
              <button
                key={c.id}
                onClick={() => navigate(`/editCard/${c.id}`)}
                className="flex items-center justify-between gap-3 rounded-2xl border border-black/5 bg-white p-3.5 text-left shadow-sm dark:border-white/10 dark:bg-white/[0.04]"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-zinc-900 dark:text-white">{c.front}</p>
                  <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {[c.reading, c.romaji, c.meaning || c.back].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    speak(c.front, /[\u3040-\u30ff\u4e00-\u9faf]/.test(c.front) ? "ja-JP" : "en-US", (m) => show(m, "info"));
                  }}
                  aria-label="Listen"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lavender-500 hover:bg-lavender-50 dark:hover:bg-white/10"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => navigate("/createDeck")}
        aria-label="Create new deck"
        className="fixed bottom-24 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-lavender-600 text-white shadow-xl shadow-lavender-500/40 transition hover:bg-lavender-700 md:right-[calc(50%-190px)]"
      >
        <Plus className="h-6 w-6" />
      </button>
    </Shell>
  );
}
