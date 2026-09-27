import { useNavigate } from "react-router-dom";
import { Star, GraduationCap } from "lucide-react";
import { Shell } from "../components/Shell";
import { TopBar } from "../components/ui/TopBar";
import { EmptyState } from "../components/ui/EmptyState";
import { useFavoriteCards } from "../hooks/useKotobaData";

export default function Favorites() {
  const navigate = useNavigate();
  const favorites = useFavoriteCards();

  return (
    <Shell>
      <TopBar title="Favorites" subtitle={`${favorites.length} cards`} />
      <div className="flex flex-col gap-4 px-5 py-5 pb-10">
        {favorites.length === 0 ? (
          <EmptyState
            icon={Star}
            title="No favorites yet"
            description="Tap the star on any card during review or in a deck to save it here."
          />
        ) : (
          <>
            <button
              onClick={() => navigate("/learn/favorites")}
              className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-lavender-600 text-sm font-semibold text-white shadow-lg shadow-lavender-500/30 hover:bg-lavender-700"
            >
              <GraduationCap className="h-4 w-4" /> Learn Favorites Only
            </button>
            <div className="flex flex-col gap-2">
              {favorites.map((c) => (
                <button
                  key={c.id}
                  onClick={() => navigate(`/editCard/${c.id}`)}
                  className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-3.5 text-left dark:border-white/10 dark:bg-white/[0.04]"
                >
                  <Star className="h-4 w-4 shrink-0 fill-amber-400 text-amber-400" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-zinc-900 dark:text-white">{c.front}</p>
                    <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {[c.reading, c.romaji, c.meaning || c.back].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </Shell>
  );
}
