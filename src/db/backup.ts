import { db } from "./db";
import type { Deck, VocabCard, ReviewLog, StudySession, UserSettings } from "./types";

export interface KotobaBackup {
  version: 1;
  exportedAt: number;
  decks: Deck[];
  cards: VocabCard[];
  reviews: ReviewLog[];
  sessions: StudySession[];
  settings: UserSettings | undefined;
}

export async function exportBackup(): Promise<void> {
  const backup: KotobaBackup = {
    version: 1,
    exportedAt: Date.now(),
    decks: await db.decks.toArray(),
    cards: await db.cards.toArray(),
    reviews: await db.reviews.toArray(),
    sessions: await db.sessions.toArray(),
    settings: await db.settings.get("settings"),
  };
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `kotoba-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export class RestoreError extends Error {}

export async function restoreBackup(file: File): Promise<{ decks: number; cards: number }> {
  if (!file.name.endsWith(".json")) {
    throw new RestoreError("Please choose a valid Kotoba backup (.json) file.");
  }
  let data: KotobaBackup;
  try {
    const text = await file.text();
    data = JSON.parse(text);
  } catch {
    throw new RestoreError("This backup file is corrupt or invalid.");
  }
  if (!data || !Array.isArray(data.decks) || !Array.isArray(data.cards)) {
    throw new RestoreError("This doesn't look like a valid Kotoba backup file.");
  }

  await db.transaction("rw", db.decks, db.cards, db.reviews, db.sessions, db.settings, async () => {
    await db.decks.clear();
    await db.cards.clear();
    await db.reviews.clear();
    await db.sessions.clear();
    await db.decks.bulkAdd(data.decks);
    await db.cards.bulkAdd(data.cards);
    if (data.reviews?.length) await db.reviews.bulkAdd(data.reviews);
    if (data.sessions?.length) await db.sessions.bulkAdd(data.sessions);
    if (data.settings) await db.settings.put(data.settings);
  });

  return { decks: data.decks.length, cards: data.cards.length };
}
