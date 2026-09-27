import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sun,
  Moon,
  SunMoon,
  Circle,
  Bell,
  Upload,
  Download,
  RotateCcw,
  Trash2,
  Info,
  Volume2,
  ChevronRight,
} from "lucide-react";
import { Shell } from "../components/Shell";
import { TopBar } from "../components/ui/TopBar";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { useSettings } from "../context/SettingsContext";
import { useToast } from "../context/ToastContext";
import type { ThemeMode } from "../db/types";
import { addSampleDecks, deleteAllData, resetAllProgress } from "../db/repository";
import { exportBackup, restoreBackup } from "../db/backup";
import { Sparkles } from "lucide-react";
import { isNotificationSupported, requestNotificationPermission, sendReviewReminder } from "../lib/notifications";

const GOALS = [5, 10, 15, 20, 25, 30, 50, 100];
const THEMES: { key: ThemeMode; label: string; icon: typeof Sun }[] = [
  { key: "system", label: "System", icon: SunMoon },
  { key: "light", label: "Light", icon: Sun },
  { key: "dark", label: "Dark", icon: Moon },
  { key: "amoled", label: "AMOLED", icon: Circle },
];

export default function Settings() {
  const { settings, update } = useSettings();
  const { show } = useToast();
  const navigate = useNavigate();
  const restoreInputRef = useRef<HTMLInputElement>(null);

  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);

  async function handleReminderToggle(enabled: boolean) {
    if (enabled) {
      const perm = await requestNotificationPermission();
      if (perm !== "granted") {
        show("Notification permission was not granted.", "error");
        return;
      }
    }
    await update({ reminderEnabled: enabled });
  }

  async function handleRestoreFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const result = await restoreBackup(file);
      show(`Restored ${result.decks} decks and ${result.cards} cards.`, "success");
    } catch (err) {
      show(err instanceof Error ? err.message : "Couldn't restore this backup.", "error");
    }
  }

  return (
    <Shell>
      <TopBar title="Settings" showBack={false} />
      <div className="flex flex-col gap-6 px-5 py-5 pb-10">
        <Section title="Profile">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Name</span>
            <input
              value={settings.name}
              onChange={(e) => update({ name: e.target.value })}
              placeholder="Your name"
              className="min-h-[48px] rounded-xl border border-zinc-200 bg-white px-3.5 text-sm outline-none focus:border-lavender-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
          </label>
        </Section>

        <Section title="Learning">
          <RowLabel label="Daily Goal" value={`${settings.dailyGoal} cards`} />
          <div className="flex flex-wrap gap-2">
            {GOALS.map((g) => (
              <Chip key={g} active={settings.dailyGoal === g} onClick={() => update({ dailyGoal: g })} label={String(g)} />
            ))}
          </div>
          <RowLabel label="New Cards / Day" value={`${settings.newCardsPerDay}`} />
          <div className="flex flex-wrap gap-2">
            {[5, 10, 15, 20].map((g) => (
              <Chip key={g} active={settings.newCardsPerDay === g} onClick={() => update({ newCardsPerDay: g })} label={String(g)} />
            ))}
          </div>
          <ToggleRow
            icon={Volume2}
            label="Auto-play pronunciation button"
            checked={settings.ttsEnabled}
            onChange={(v) => update({ ttsEnabled: v })}
          />
          <label className="flex flex-col gap-2 pt-1">
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Swipe sensitivity</span>
            <input
              type="range"
              min={0.5}
              max={1.5}
              step={0.1}
              value={settings.swipeSensitivity}
              onChange={(e) => update({ swipeSensitivity: Number(e.target.value) })}
              className="accent-lavender-600"
            />
          </label>
        </Section>

        <Section title="Appearance">
          <div className="grid grid-cols-4 gap-2">
            {THEMES.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => update({ theme: key })}
                className={`flex flex-col items-center gap-1 rounded-2xl border-2 py-3 text-xs font-semibold transition ${
                  settings.theme === key
                    ? "border-lavender-600 bg-lavender-50 text-lavender-700 dark:bg-lavender-500/10 dark:text-lavender-300"
                    : "border-zinc-200 text-zinc-600 dark:border-white/10 dark:text-zinc-300"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Notifications">
          <ToggleRow
            icon={Bell}
            label="Daily reminder"
            checked={settings.reminderEnabled}
            onChange={handleReminderToggle}
          />
          {settings.reminderEnabled && (
            <>
              <label className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Reminder time</span>
                <input
                  type="time"
                  value={settings.reminderTime}
                  onChange={(e) => update({ reminderTime: e.target.value })}
                  className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </label>
              <button
                onClick={() => {
                  if (!isNotificationSupported()) {
                    show("Notifications aren't supported on this device.", "error");
                    return;
                  }
                  sendReviewReminder();
                  show("Test notification sent.", "success");
                }}
                className="self-start text-xs font-semibold text-lavender-600 dark:text-lavender-300"
              >
                Send test notification
              </button>
            </>
          )}
        </Section>

        <Section title="Data">
          <NavRow icon={Upload} label="Import Anki / CSV" onClick={() => navigate("/import")} />
          <NavRow icon={Download} label="Backup Data (JSON)" onClick={() => exportBackup().then(() => show("Backup downloaded", "success"))} />
          <NavRow icon={Upload} label="Restore from Backup" onClick={() => restoreInputRef.current?.click()} />
          <input ref={restoreInputRef} type="file" accept="application/json" className="hidden" onChange={handleRestoreFile} />
          {!settings.sampleDecksAdded && (
            <NavRow
              icon={Sparkles}
              label="Add Sample Decks"
              onClick={async () => {
                await addSampleDecks();
                show("Sample decks added", "success");
              }}
            />
          )}
        </Section>

        <Section title="About">
          <RowLabel label="Version" value="1.0.0" />
          <NavRow icon={Info} label="Open Source & Privacy" onClick={() => show("Kotoba is offline-first: your vocabulary never leaves this device. No accounts, no ads, no tracking.", "info")} />
        </Section>

        <Section title="Danger Zone">
          <NavRow icon={RotateCcw} label="Reset all progress" onClick={() => setConfirmReset(true)} destructive />
          <NavRow icon={Trash2} label="Delete all data" onClick={() => setConfirmDeleteAll(true)} destructive />
        </Section>
      </div>

      <ConfirmDialog
        open={confirmReset}
        title="Reset all progress?"
        description="All cards will return to 'new' and your streak will reset. Decks and vocabulary are kept."
        confirmLabel="Reset"
        destructive
        onCancel={() => setConfirmReset(false)}
        onConfirm={async () => {
          await resetAllProgress();
          setConfirmReset(false);
          show("Progress has been reset.", "success");
        }}
      />
      <ConfirmDialog
        open={confirmDeleteAll}
        title="Delete all data?"
        description="This permanently deletes every deck, card, and setting on this device. This cannot be undone."
        confirmLabel="Delete Everything"
        destructive
        onCancel={() => setConfirmDeleteAll(false)}
        onConfirm={async () => {
          await deleteAllData();
          setConfirmDeleteAll(false);
          show("All data deleted.", "success");
          navigate("/", { replace: true });
        }}
      />
    </Shell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-black/5 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{title}</h2>
      {children}
    </div>
  );
}

function RowLabel({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">{label}</span>
      <span className="text-sm font-semibold text-lavender-600 dark:text-lavender-300">{value}</span>
    </div>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`min-h-[36px] rounded-full px-3.5 text-sm font-medium transition ${
        active ? "bg-lavender-600 text-white" : "bg-zinc-100 text-zinc-600 dark:bg-white/10 dark:text-zinc-300"
      }`}
    >
      {label}
    </button>
  );
}

function ToggleRow({
  icon: Icon,
  label,
  checked,
  onChange,
}: {
  icon: typeof Bell;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-300">
        <Icon className="h-4 w-4" /> {label}
      </span>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${checked ? "bg-lavender-600" : "bg-zinc-300 dark:bg-white/15"}`}
      >
        <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}

function NavRow({
  icon: Icon,
  label,
  onClick,
  destructive,
}: {
  icon: typeof Bell;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex min-h-[48px] items-center justify-between rounded-xl px-1 text-sm font-medium transition hover:bg-zinc-50 dark:hover:bg-white/5 ${
        destructive ? "text-rose-600 dark:text-rose-400" : "text-zinc-700 dark:text-zinc-200"
      }`}
    >
      <span className="flex items-center gap-2">
        <Icon className="h-4 w-4" /> {label}
      </span>
      <ChevronRight className="h-4 w-4 text-zinc-300" />
    </button>
  );
}
