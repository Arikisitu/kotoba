// Core domain types for Kotoba

export type CardState = "new" | "learning" | "review" | "relearning";
export type Rating = "again" | "hard" | "good" | "easy";
export type ThemeMode = "light" | "dark" | "amoled" | "system";

export interface Deck {
  id: string;
  name: string;
  description: string;
  language: string;
  createdAt: number;
  updatedAt: number;
}

export interface VocabCard {
  id: string;
  deckId: string;
  front: string;
  back: string;
  reading: string;
  romaji: string;
  meaning: string;
  exampleSentence: string;
  exampleTranslation: string;
  notes: string;
  tags: string[];
  imageUrl: string;
  isFavorite: boolean;
  createdAt: number;
  updatedAt: number;

  // Scheduling (Anki-inspired SM-2)
  state: CardState;
  nextReview: number; // timestamp ms
  lastReviewed: number | null;
  reviewCount: number;
  lapses: number;
  interval: number; // in days (can be fractional for learning steps)
  easeFactor: number; // e.g. 2.5
  learningStep: number; // index into learning steps array
}

export interface ReviewLog {
  id: string;
  cardId: string;
  deckId: string;
  rating: Rating;
  reviewedAt: number;
  intervalBefore: number;
  intervalAfter: number;
}

export interface StudySession {
  id: string;
  date: string; // YYYY-MM-DD
  startedAt: number;
  endedAt: number | null;
  cardsReviewed: number;
  again: number;
  hard: number;
  good: number;
  easy: number;
}

export interface UserSettings {
  id: string; // singleton "settings"
  name: string;
  dailyGoal: number;
  newCardsPerDay: number;
  theme: ThemeMode;
  reminderEnabled: boolean;
  reminderTime: string; // "HH:MM"
  ttsEnabled: boolean;
  swipeSensitivity: number; // px threshold multiplier 0.5 - 1.5
  onboardingComplete: boolean;
  sampleDecksAdded: boolean;
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string | null; // YYYY-MM-DD
}

export const DEFAULT_SETTINGS: UserSettings = {
  id: "settings",
  name: "",
  dailyGoal: 20,
  newCardsPerDay: 10,
  theme: "system",
  reminderEnabled: false,
  reminderTime: "20:00",
  ttsEnabled: true,
  swipeSensitivity: 1,
  onboardingComplete: false,
  sampleDecksAdded: false,
  currentStreak: 0,
  longestStreak: 0,
  lastStudyDate: null,
};
