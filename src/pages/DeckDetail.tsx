import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  GraduationCap,
  Plus,
  Pencil,
  Upload,
  Download,
  Trash2,
  MoreVertical,
  Star,
  Copy,
  FolderInput,
  Layers,
} from "lucide-react";
import { Shell } from "../components/Shell";
import { TopBar } from "../components/ui/TopBar";
import { ProgressBar } from "../components/ui/ProgressBar";
import { EmptyState } from "../components/ui/EmptyState";
import { ActionSheet, type ActionSheetItem } from "../components/ui/ActionSheet";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { useDeck, useDeckCards, deckStats, useDecks } from "../hooks/useKotobaData";
import { deleteCard, deleteDeck, duplicateCard, moveCard, toggleFavorite } from "../db/repository";
import { exportDeckAsCSV, exportDeckAsTXT } from "../db/importExport";
import { useToast } from "../context/ToastContext";
import type { VocabCard } from "../db/types";

export default function DeckDetail() {
  const { deckId = "" } = useParams();
  const navigate = useNavigate();
  const { show } = useToast();
  const deck = useDeck(deckId);
  const cards = useDeckCards(deckId) ?? [];
  const allDecks = useDecks() ?? [];
  const stats = useMemo(() => deckStats(cards), [cards]);

  const [menuOpen, setMenuOpen] = useState(false);
  const [cardMenu, setCardMenu] = useState<VocabCard | null>(null);
  const [moveSheet, setMoveSheet] = useState<VocabCard | null>(null);
  const [confirmDeleteDeck, setConfirmDeleteDeck] = useState(false);
  const [confirmDeleteCard, setConfirmDeleteCard] = useState<VocabCard | null>(null);
  const [exportSheet, setExportSheet] = useState(false);

  if (!deck) {
    return (
      <Shell>
        <TopBar title="Deck" />
        <div className="px-5 py-10">
          <EmptyState icon={Layers} title="Deck not found" description="This deck may have been deleted." />
        </div>
      </Shell>
    );
  }

  const progress = stats.total > 0 ? (stats.learned / stats.total) * 100 : 0;

  const deckMenuItems: ActionSheetItem[] = [
    { label: "Edit Deck", icon: Pencil, onClick: () => navigate(`/editDeck/${deckId}`) },
    { label: "Import Vocabulary", icon: Upload, onClick: () => navigate(`/import?deckId=${deckId}`) },
    { label: "Export Deck", icon: Download, onClick: () => setExportSheet(true) },
    { label: "Delete Deck", icon: Trash2, onClick: () => setConfirmDeleteDeck(true), destructive: true },
  ];

  const exportItems: ActionSheetItem[] = [
    { label: "Export as CSV", icon: Download, onClick: () => exportDeckAsCSV(deckId, deck.name).then(() => show("Deck exported as CSV", "success")) },
    { label: "Export as TXT", icon: Download, onClick: () => exportDeckAsTXT(deckId, deck.name).then(() => show("Deck exported as TXT", "success")) },
  ];

  function cardMenuItemsFor(card: VocabCard): ActionSheetItem[] {
    return [
      { label: "Edit Card", icon: Pencil, onClick: () => navigate(`/editCard/${card.id}`) },
      {
        label: card.isFavorite ? "Remove from Favorites" : "Add to Favorites",
        icon: Star,
        onClick: () => toggleFavorite(card.id),
      },
      { label: "Duplicate Card", icon: Copy, onClick: () => duplicateCard(card.id).then(() => show("Card duplicated", "success")) },
      { label: "Move to Deck...", icon: FolderInput, onClick: () => setMoveSheet(card) },
      { label: "Delete Card", icon: Trash2, onClick: () => setConfirmDeleteCard(card), destructive: true },
    ];
  }

  return (
    <Shell>
      <TopBar
        title={deck.name}
        subtitle={`${stats.total} cards`}
        right={
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Deck options"
            className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/10"
          >
            <MoreVertical className="h-5 w-5" />
          </button>
        }
      />

      <div className="flex flex-col gap-5 px-5 py-5 pb-24">
        {deck.description && <p className="text-sm text-zinc-500 dark:text-zinc-400">{deck.description}</p>}

        <div className="rounded-2xl border border-black/5 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-semibold text-zinc-800 dark:text-zinc-100">Learning progress</span>
            <span className="text-zinc-500 dark:text-zinc-400">{Math.round(progress)}%</span>
          </div>
          <ProgressBar value={progress} />
          <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs text-zinc-500 dark:text-zinc-400">
            <MiniStat label="New" value={stats.newCount} />
            <MiniStat label="Learning" value={stats.learning} />
            <MiniStat label="Learned" value={stats.learned} />
            <MiniStat label="Due" value={stats.due} accent="text-lavender-600 dark:text-lavender-300" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate(`/learn/${deckId}`)}
            className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-lavender-600 text-sm font-semibold text-white shadow-lg shadow-lavender-500/30 hover:bg-lavender-700"
          >
            <GraduationCap className="h-4 w-4" /> Start Learning
          </button>
          <button
            onClick={() => navigate(`/createCard/${deckId}`)}
            className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-lavender-200 text-sm font-semibold text-lavender-600 hover:bg-lavender-50 dark:border-lavender-500/30 dark:text-lavender-300 dark:hover:bg-white/5"
          >
            <Plus className="h-4 w-4" /> Add Card
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Vocabulary ({cards.length})</h2>
          {cards.length === 0 ? (
            <EmptyState
              icon={Layers}
              title="This deck doesn't have any cards yet."
              description="Add your first word to start building this deck."
              action={
                <button
                  onClick={() => navigate(`/createCard/${deckId}`)}
                  className="min-h-[48px] rounded-2xl bg-lavender-600 px-5 text-sm font-semibold text-white hover:bg-lavender-700"
                >
                  Add vocabulary
                </button>
              }
            />
          ) : (
            <div className="flex flex-col gap-2">
              {cards.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-3.5 dark:border-white/10 dark:bg-white/[0.04]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate font-semibold text-zinc-900 dark:text-white">{c.front}</p>
                      {c.isFavorite && <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />}
                    </div>
                    <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {[c.reading, c.romaji, c.meaning || c.back].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-1 text-[10px] font-medium uppercase text-zinc-500 dark:bg-white/10 dark:text-zinc-400">
                    {c.state}
                  </span>
                  <button
                    onClick={() => setCardMenu(c)}
                    aria-label="Card options"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/10"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ActionSheet open={menuOpen} title="Deck Options" items={deckMenuItems} onClose={() => setMenuOpen(false)} />
      <ActionSheet open={exportSheet} title="Export Deck" items={exportItems} onClose={() => setExportSheet(false)} />
      <ActionSheet
        open={!!cardMenu}
        title={cardMenu?.front}
        items={cardMenu ? cardMenuItemsFor(cardMenu) : []}
        onClose={() => setCardMenu(null)}
      />
      <ActionSheet
        open={!!moveSheet}
        title="Move to deck"
        items={allDecks
          .filter((d) => d.id !== deckId)
          .map((d) => ({
            label: d.name,
            icon: Layers,
            onClick: () => moveSheet && moveCard(moveSheet.id, d.id).then(() => show(`Moved to ${d.name}`, "success")),
          }))}
        onClose={() => setMoveSheet(null)}
      />

      <ConfirmDialog
        open={confirmDeleteDeck}
        title="Delete this deck?"
        description={`"${deck.name}" and all ${cards.length} cards inside it will be permanently deleted.`}
        confirmLabel="Delete"
        destructive
        onCancel={() => setConfirmDeleteDeck(false)}
        onConfirm={async () => {
          await deleteDeck(deckId);
          setConfirmDeleteDeck(false);
          show("Deck deleted", "success");
          navigate("/library", { replace: true });
        }}
      />
      <ConfirmDialog
        open={!!confirmDeleteCard}
        title="Delete this card?"
        description={`"${confirmDeleteCard?.front}" will be permanently removed.`}
        confirmLabel="Delete"
        destructive
        onCancel={() => setConfirmDeleteCard(null)}
        onConfirm={async () => {
          if (confirmDeleteCard) {
            await deleteCard(confirmDeleteCard.id);
            show("Card deleted", "success");
          }
          setConfirmDeleteCard(null);
        }}
      />
    </Shell>
  );
}

function MiniStat({ label, value, accent = "text-zinc-700 dark:text-zinc-200" }: { label: string; value: number; accent?: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className={`text-sm font-bold ${accent}`}>{value}</span>
      <span className="text-[10px] uppercase tracking-wide text-zinc-400">{label}</span>
    </div>
  );
}
