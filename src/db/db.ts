import Dexie, { type Table } from "dexie";
import type { Deck, VocabCard, ReviewLog, StudySession, UserSettings } from "./types";

export class KotobaDB extends Dexie {
  decks!: Table<Deck, string>;
  cards!: Table<VocabCard, string>;
  reviews!: Table<ReviewLog, string>;
  sessions!: Table<StudySession, string>;
  settings!: Table<UserSettings, string>;

  constructor() {
    super("kotoba-db");
    this.version(1).stores({
      decks: "id, name, createdAt",
      cards: "id, deckId, nextReview, state, isFavorite, front, back, *tags",
      reviews: "id, cardId, deckId, reviewedAt",
      sessions: "id, date, startedAt",
      settings: "id",
    });
  }
}

export const db = new KotobaDB();
