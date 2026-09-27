import type { StudySession } from "../db/types";
import { dayKey } from "./statsUtils";

export function greetingForNow(date: Date = new Date()): string {
  const h = date.getHours();
  if (h < 5) return "Good night";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function todayReviewedCount(sessions: StudySession[]): number {
  const today = dayKey(new Date());
  return sessions.filter((s) => s.date === today).reduce((sum, s) => sum + s.cardsReviewed, 0);
}
