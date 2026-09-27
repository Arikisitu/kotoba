import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/db";
import { DEFAULT_SETTINGS, type UserSettings } from "../db/types";
import { getSettings, updateSettings } from "../db/repository";
import { startReminderWatcher } from "../lib/notifications";
import { primeVoices } from "../lib/tts";

interface SettingsContextValue {
  settings: UserSettings;
  loading: boolean;
  update: (patch: Partial<UserSettings>) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const liveSettings = useLiveQuery(() => db.settings.get("settings"), []);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getSettings().finally(() => setReady(true));
    primeVoices();
  }, []);

  const settings = liveSettings ?? DEFAULT_SETTINGS;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark", "amoled");
    const mode = settings.theme;
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (mode === "dark" || (mode === "system" && systemDark)) {
      root.classList.add("dark");
    } else if (mode === "amoled") {
      root.classList.add("dark", "amoled");
    }
  }, [settings.theme]);

  useEffect(() => {
    startReminderWatcher(
      () => settings.reminderTime,
      () => settings.reminderEnabled
    );
  }, [settings.reminderTime, settings.reminderEnabled]);

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      loading: !ready,
      update: async (patch) => {
        await updateSettings(patch);
      },
    }),
    [settings, ready]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
