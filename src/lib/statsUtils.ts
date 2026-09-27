import type { ReviewLog, StudySession } from "../db/types";

export function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function lastNDays(n: number): string[] {
  const days: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    days.push(dayKey(d));
  }
  return days;
}

export function activityByDay(reviews: ReviewLog[], days: string[]): number[] {
  const counts = new Map<string, number>();
  for (const r of reviews) {
    const key = dayKey(new Date(r.reviewedAt));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return days.map((d) => counts.get(d) ?? 0);
}

export function ratingBreakdown(reviews: ReviewLog[]) {
  return {
    again: reviews.filter((r) => r.rating === "again").length,
    hard: reviews.filter((r) => r.rating === "hard").length,
    good: reviews.filter((r) => r.rating === "good").length,
    easy: reviews.filter((r) => r.rating === "easy").length,
  };
}

export function totalStudyTimeMs(sessions: StudySession[]): number {
  return sessions.reduce((sum, s) => {
    const end = s.endedAt ?? s.startedAt;
    return sum + Math.max(0, end - s.startedAt);
  }, 0);
}

export function formatDuration(ms: number): string {
  const totalMinutes = Math.round(ms / 60000);
  if (totalMinutes < 1) return "< 1 min";
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}m`;
}

export function formatDayLabel(key: string): string {
  const today = dayKey(new Date());
  const yesterday = dayKey(new Date(Date.now() - 86400000));
  if (key === today) return "Today";
  if (key === yesterday) return "Yesterday";
  const d = new Date(key + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "long", day: "numeric" });
}
