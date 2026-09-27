import type { CardState, Rating, VocabCard } from "./types";

// Anki-inspired spaced repetition scheduler.
// Learning steps are in minutes; review intervals are in days.
export const LEARNING_STEPS_MIN = [1, 10];
export const RELEARNING_STEPS_MIN = [10];
export const GRADUATING_INTERVAL_DAYS = 1;
export const EASY_INTERVAL_DAYS = 4;
export const MIN_EASE = 1.3;
export const STARTING_EASE = 2.5;

const minutesToMs = (m: number) => m * 60 * 1000;
const daysToMs = (d: number) => d * 24 * 60 * 60 * 1000;

export interface ScheduleResult {
  state: CardState;
  nextReview: number;
  interval: number;
  easeFactor: number;
  lapses: number;
  learningStep: number;
  reviewCount: number;
  lastReviewed: number;
}

/**
 * Compute the next scheduling state for a card given a review rating.
 * Mirrors Anki's algorithm at a simplified but functionally faithful level:
 * - New/Learning cards move through short learning steps before graduating.
 * - Review cards use interval * easeFactor growth.
 * - Lapses ("Again" on a review card) demote the card into relearning.
 */
export function scheduleCard(card: VocabCard, rating: Rating, now: number = Date.now()): ScheduleResult {
  const reviewCount = card.reviewCount + 1;
  let { state, interval, easeFactor, lapses, learningStep } = card;

  if (state === "new" || state === "learning") {
    if (rating === "again") {
      state = "learning";
      learningStep = 0;
      interval = LEARNING_STEPS_MIN[0] / (24 * 60);
      return finish(state, now + minutesToMs(LEARNING_STEPS_MIN[0]), interval, easeFactor, lapses, learningStep, reviewCount, now);
    }
    if (rating === "hard") {
      state = "learning";
      const stepIdx = Math.min(learningStep, LEARNING_STEPS_MIN.length - 1);
      const mins = LEARNING_STEPS_MIN[stepIdx];
      interval = mins / (24 * 60);
      return finish(state, now + minutesToMs(mins), interval, easeFactor, lapses, learningStep, reviewCount, now);
    }
    if (rating === "good") {
      const nextIdx = (state === "new" ? 0 : learningStep) + 1;
      if (nextIdx < LEARNING_STEPS_MIN.length) {
        state = "learning";
        learningStep = nextIdx;
        const mins = LEARNING_STEPS_MIN[nextIdx];
        interval = mins / (24 * 60);
        return finish(state, now + minutesToMs(mins), interval, easeFactor, lapses, learningStep, reviewCount, now);
      }
      state = "review";
      interval = GRADUATING_INTERVAL_DAYS;
      learningStep = 0;
      return finish(state, now + daysToMs(interval), interval, easeFactor, lapses, learningStep, reviewCount, now);
    }
    // easy
    state = "review";
    interval = EASY_INTERVAL_DAYS;
    learningStep = 0;
    return finish(state, now + daysToMs(interval), interval, easeFactor, lapses, learningStep, reviewCount, now);
  }

  if (state === "review") {
    if (rating === "again") {
      lapses += 1;
      easeFactor = Math.max(MIN_EASE, easeFactor - 0.2);
      state = "relearning";
      learningStep = 0;
      const mins = RELEARNING_STEPS_MIN[0];
      const relInterval = mins / (24 * 60);
      return finish(state, now + minutesToMs(mins), relInterval, easeFactor, lapses, learningStep, reviewCount, now);
    }
    if (rating === "hard") {
      easeFactor = Math.max(MIN_EASE, easeFactor - 0.15);
      interval = Math.max(interval + 1, interval * 1.2);
      return finish(state, now + daysToMs(interval), interval, easeFactor, lapses, learningStep, reviewCount, now);
    }
    if (rating === "good") {
      interval = Math.max(1, interval * easeFactor);
      return finish(state, now + daysToMs(interval), interval, easeFactor, lapses, learningStep, reviewCount, now);
    }
    // easy
    easeFactor = easeFactor + 0.15;
    interval = Math.max(1, interval * easeFactor * 1.3);
    return finish(state, now + daysToMs(interval), interval, easeFactor, lapses, learningStep, reviewCount, now);
  }

  // relearning
  if (rating === "again") {
    learningStep = 0;
    const mins = RELEARNING_STEPS_MIN[0];
    interval = mins / (24 * 60);
    return finish(state, now + minutesToMs(mins), interval, easeFactor, lapses, learningStep, reviewCount, now);
  }
  if (rating === "hard") {
    const stepIdx = Math.min(learningStep, RELEARNING_STEPS_MIN.length - 1);
    const mins = RELEARNING_STEPS_MIN[stepIdx];
    interval = mins / (24 * 60);
    return finish(state, now + minutesToMs(mins), interval, easeFactor, lapses, learningStep, reviewCount, now);
  }
  if (rating === "good") {
    const nextIdx = learningStep + 1;
    if (nextIdx < RELEARNING_STEPS_MIN.length) {
      learningStep = nextIdx;
      const mins = RELEARNING_STEPS_MIN[nextIdx];
      interval = mins / (24 * 60);
      return finish(state, now + minutesToMs(mins), interval, easeFactor, lapses, learningStep, reviewCount, now);
    }
    state = "review";
    interval = Math.max(1, interval);
    learningStep = 0;
    return finish(state, now + daysToMs(interval), interval, easeFactor, lapses, learningStep, reviewCount, now);
  }
  // easy - graduate immediately back to review
  state = "review";
  interval = Math.max(1, interval * 1.3);
  learningStep = 0;
  return finish(state, now + daysToMs(interval), interval, easeFactor, lapses, learningStep, reviewCount, now);
}

function finish(
  state: CardState,
  nextReview: number,
  interval: number,
  easeFactor: number,
  lapses: number,
  learningStep: number,
  reviewCount: number,
  now: number
): ScheduleResult {
  return { state, nextReview, interval, easeFactor, lapses, learningStep, reviewCount, lastReviewed: now };
}

export function newCardDefaults(): Pick<
  VocabCard,
  "state" | "nextReview" | "lastReviewed" | "reviewCount" | "lapses" | "interval" | "easeFactor" | "learningStep"
> {
  return {
    state: "new",
    nextReview: Date.now(),
    lastReviewed: null,
    reviewCount: 0,
    lapses: 0,
    interval: 0,
    easeFactor: STARTING_EASE,
    learningStep: 0,
  };
}

export function formatInterval(days: number): string {
  if (days < 1 / 24) return `${Math.round(days * 24 * 60)}m`;
  if (days < 1) return `${Math.round(days * 24)}h`;
  if (days < 30) return `${Math.round(days)}d`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${(days / 365).toFixed(1)}y`;
}
