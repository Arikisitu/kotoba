import { v4 as uuid } from "uuid";
import { db } from "./db";
import type { Deck, VocabCard, ReviewLog, StudySession, UserSettings, Rating } from "./types";
import { DEFAULT_SETTINGS } from "./types";
import { newCardDefaults, scheduleCard } from "./scheduler";
import { SAMPLE_DECKS } from "./sampleData";

// ---------- Settings ----------
export async function getSettings(): Promise<UserSettings> {
  const existing = await db.settings.get("settings");
  if (existing) return existing;
  await db.settings.put(DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}

export async function updateSettings(patch: Partial<UserSettings>): Promise<UserSettings> {
  const current = await getSettings();
  const next = { ...current, ...patch };
  await db.settings.put(next);
  return next;
}

// ---------- Decks ----------
export async function createDeck(input: { name: string; description?: string; language?: string }): Promise<Deck> {
  const now = Date.now();
  const deck: Deck = {
    id: uuid(),
    name: input.name.trim(),
    description: input.description?.trim() ?? "",
    language: input.language?.trim() ?? "General",
    createdAt: now,
    updatedAt: now,
  };
  await db.decks.add(deck);
  return deck;
}

export async function updateDeck(id: string, patch: Partial<Deck>): Promise<void> {
  await db.decks.update(id, { ...patch, updatedAt: Date.now() });
}

export async function deleteDeck(id: string): Promise<void> {
  await db.transaction("rw", db.decks, db.cards, db.reviews, async () => {
    const cardIds = (await db.cards.where("deckId").equals(id).primaryKeys()) as string[];
    await db.cards.bulkDelete(cardIds);
    if (cardIds.length) {
      await db.reviews.where("cardId").anyOf(cardIds).delete();
    }
    await db.decks.delete(id);
  });
}

export async function getDeck(id: string): Promise<Deck | undefined> {
  return db.decks.get(id);
}

// ---------- Cards ----------
export interface CardInput {
  deckId: string;
  front: string;
  back: string;
  reading?: string;
  romaji?: string;
  meaning?: string;
  exampleSentence?: string;
  exampleTranslation?: string;
  notes?: string;
  tags?: string[];
  imageUrl?: string;
}

export async function createCard(input: CardInput): Promise<VocabCard> {
  const now = Date.now();
  const card: VocabCard = {
    id: uuid(),
    deckId: input.deckId,
    front: input.front.trim(),
    back: input.back.trim(),
    reading: input.reading?.trim() ?? "",
    romaji: input.romaji?.trim() ?? "",
    meaning: input.meaning?.trim() ?? "",
    exampleSentence: input.exampleSentence?.trim() ?? "",
    exampleTranslation: input.exampleTranslation?.trim() ?? "",
    notes: input.notes?.trim() ?? "",
    tags: input.tags?.map((t) => t.trim()).filter(Boolean) ?? [],
    imageUrl: input.imageUrl ?? "",
    isFavorite: false,
    createdAt: now,
    updatedAt: now,
    ...newCardDefaults(),
  };
  await db.cards.add(card);
  await db.decks.update(input.deckId, { updatedAt: now });
  return card;
}

export async function updateCard(id: string, patch: Partial<VocabCard>): Promise<void> {
  await db.cards.update(id, { ...patch, updatedAt: Date.now() });
}

export async function deleteCard(id: string): Promise<void> {
  await db.transaction("rw", db.cards, db.reviews, async () => {
    await db.reviews.where("cardId").equals(id).delete();
    await db.cards.delete(id);
  });
}

export async function duplicateCard(id: string): Promise<VocabCard | undefined> {
  const original = await db.cards.get(id);
  if (!original) return undefined;
  const now = Date.now();
  const copy: VocabCard = {
    ...original,
    id: uuid(),
    front: original.front + " (copy)",
    createdAt: now,
    updatedAt: now,
    ...newCardDefaults(),
  };
  await db.cards.add(copy);
  return copy;
}

export async function moveCard(id: string, newDeckId: string): Promise<void> {
  await db.cards.update(id, { deckId: newDeckId, updatedAt: Date.now() });
}

export async function toggleFavorite(id: string): Promise<void> {
  const card = await db.cards.get(id);
  if (!card) return;
  await db.cards.update(id, { isFavorite: !card.isFavorite });
}

export async function getDueCards(deckId?: string, now: number = Date.now()): Promise<VocabCard[]> {
  let collection = db.cards.where("nextReview").belowOrEqual(now);
  const all = await collection.toArray();
  return deckId ? all.filter((c) => c.deckId === deckId) : all;
}

export async function getDeckCards(deckId: string): Promise<VocabCard[]> {
  return db.cards.where("deckId").equals(deckId).toArray();
}

export async function getAllCards(): Promise<VocabCard[]> {
  return db.cards.toArray();
}

// ---------- Review submission ----------
export async function submitReview(card: VocabCard, rating: Rating, session?: StudySession): Promise<VocabCard> {
  const result = scheduleCard(card, rating);
  const updated: VocabCard = {
    ...card,
    ...result,
    updatedAt: Date.now(),
  };
  await db.cards.put(updated);

  const log: ReviewLog = {
    id: uuid(),
    cardId: card.id,
    deckId: card.deckId,
    rating,
    reviewedAt: Date.now(),
    intervalBefore: card.interval,
    intervalAfter: result.interval,
  };
  await db.reviews.add(log);

  if (session) {
    session.cardsReviewed += 1;
    session[rating] += 1;
    await db.sessions.put(session);
  }

  return updated;
}

// ---------- Sessions ----------
export function todayKey(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export async function startSession(): Promise<StudySession> {
  const session: StudySession = {
    id: uuid(),
    date: todayKey(),
    startedAt: Date.now(),
    endedAt: null,
    cardsReviewed: 0,
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
  };
  await db.sessions.add(session);
  return session;
}

export async function endSession(session: StudySession): Promise<void> {
  session.endedAt = Date.now();
  await db.sessions.put(session);
  if (session.cardsReviewed > 0) {
    await recordStreakForToday();
  }
}

export async function recordStreakForToday(): Promise<UserSettings> {
  const settings = await getSettings();
  const today = todayKey();
  if (settings.lastStudyDate === today) return settings; // already recorded today
  let newStreak = 1;
  if (settings.lastStudyDate) {
    const last = new Date(settings.lastStudyDate + "T00:00:00");
    const diffDays = Math.round((new Date(today + "T00:00:00").getTime() - last.getTime()) / 86400000);
    if (diffDays === 1) newStreak = settings.currentStreak + 1;
    else if (diffDays === 0) newStreak = settings.currentStreak;
    else newStreak = 1; // streak broken, restart gently
  }
  const longest = Math.max(settings.longestStreak, newStreak);
  return updateSettings({ currentStreak: newStreak, longestStreak: longest, lastStudyDate: today });
}

export async function getTodaySessions(): Promise<StudySession[]> {
  const today = todayKey();
  return db.sessions.where("date").equals(today).toArray();
}

export async function getAllSessions(): Promise<StudySession[]> {
  return db.sessions.orderBy("date").reverse().toArray();
}

// ---------- Sample decks ----------
export async function addSampleDecks(): Promise<void> {
  for (const seed of SAMPLE_DECKS) {
    const deck = await createDeck({ name: seed.name, description: seed.description, language: seed.language });
    for (const c of seed.cards) {
      await createCard({ deckId: deck.id, ...c });
    }
  }
  await updateSettings({ sampleDecksAdded: true });
}

// ---------- Reset / Delete all ----------
export async function resetAllProgress(): Promise<void> {
  const cards = await db.cards.toArray();
  await db.transaction("rw", db.cards, db.reviews, db.sessions, async () => {
    for (const c of cards) {
      await db.cards.update(c.id, { ...newCardDefaults() });
    }
    await db.reviews.clear();
    await db.sessions.clear();
  });
  await updateSettings({ currentStreak: 0, longestStreak: 0, lastStudyDate: null });
}

export async function deleteAllData(): Promise<void> {
  await db.transaction("rw", db.decks, db.cards, db.reviews, db.sessions, db.settings, async () => {
    await db.decks.clear();
    await db.cards.clear();
    await db.reviews.clear();
    await db.sessions.clear();
    await db.settings.clear();
  });
  await db.settings.put(DEFAULT_SETTINGS);
}
