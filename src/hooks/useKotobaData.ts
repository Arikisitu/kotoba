import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/db";
import type { VocabCard } from "../db/types";

export function useDecks() {
  return useLiveQuery(() => db.decks.orderBy("createdAt").reverse().toArray(), [], []);
}

export function useDeck(deckId: string | undefined) {
  return useLiveQuery(() => (deckId ? db.decks.get(deckId) : undefined), [deckId]);
}

export function useAllCards() {
  return useLiveQuery(() => db.cards.toArray(), [], []);
}

export function useDeckCards(deckId: string | undefined) {
  return useLiveQuery(() => (deckId ? db.cards.where("deckId").equals(deckId).toArray() : []), [deckId], []);
}

export function useCard(cardId: string | undefined) {
  return useLiveQuery(() => (cardId ? db.cards.get(cardId) : undefined), [cardId]);
}

export function useDueCount(deckId?: string, now?: number) {
  const cards = useAllCards();
  const t = now ?? Date.now();
  return (cards ?? []).filter((c) => c.nextReview <= t && (!deckId || c.deckId === deckId)).length;
}

export function useFavoriteCards() {
  const cards = useAllCards();
  return (cards ?? []).filter((c) => c.isFavorite);
}

export function useSessions() {
  return useLiveQuery(() => db.sessions.orderBy("startedAt").reverse().toArray(), [], []);
}

export function useReviews() {
  return useLiveQuery(() => db.reviews.orderBy("reviewedAt").reverse().toArray(), [], []);
}

export function deckStats(cards: VocabCard[], now: number = Date.now()) {
  const total = cards.length;
  const due = cards.filter((c) => c.nextReview <= now).length;
  const newCount = cards.filter((c) => c.state === "new").length;
  const learning = cards.filter((c) => c.state === "learning" || c.state === "relearning").length;
  const learned = cards.filter((c) => c.state === "review").length;
  return { total, due, newCount, learning, learned };
}
