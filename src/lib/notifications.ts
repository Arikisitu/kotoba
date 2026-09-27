// Best-effort local reminder using the Notification API.
// Web apps cannot schedule true background alarms without a service worker +
// push server; this implements an in-session daily check plus an explicit
// "send test notification" action so the feature is real and verifiable
// rather than a fake toggle.

export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return "denied";
  if (Notification.permission === "granted" || Notification.permission === "denied") {
    return Notification.permission;
  }
  return Notification.requestPermission();
}

export function sendReviewReminder() {
  if (!isNotificationSupported()) return;
  if (Notification.permission !== "granted") return;
  new Notification("Kotoba", {
    body: "Your Kotoba review is ready 📚",
    icon: "/kotoba-icon.svg",
    tag: "kotoba-daily-reminder",
  });
}

const CHECK_INTERVAL_MS = 60_000;
let intervalHandle: number | undefined;

/**
 * Starts a lightweight in-app scheduler that fires the reminder notification
 * once per day at the configured HH:MM, as long as the app is open. Safe to
 * call multiple times; only one interval is kept alive.
 */
export function startReminderWatcher(getReminderTime: () => string, getEnabled: () => boolean) {
  stopReminderWatcher();
  let lastFiredDate: string | null = null;
  intervalHandle = window.setInterval(() => {
    if (!getEnabled()) return;
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const current = `${hh}:${mm}`;
    const today = now.toISOString().slice(0, 10);
    if (current === getReminderTime() && lastFiredDate !== today) {
      lastFiredDate = today;
      sendReviewReminder();
    }
  }, CHECK_INTERVAL_MS);
}

export function stopReminderWatcher() {
  if (intervalHandle) {
    window.clearInterval(intervalHandle);
    intervalHandle = undefined;
  }
}
