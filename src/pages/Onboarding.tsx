import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpenText, Check, Moon, Sun, SunMoon, Circle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../context/SettingsContext";
import { addSampleDecks } from "../db/repository";
import type { ThemeMode } from "../db/types";
import { useToast } from "../context/ToastContext";

const GOALS = [10, 20, 30];
const THEMES: { key: ThemeMode; label: string; icon: typeof Sun }[] = [
  { key: "system", label: "System", icon: SunMoon },
  { key: "light", label: "Light", icon: Sun },
  { key: "dark", label: "Dark", icon: Moon },
  { key: "amoled", label: "AMOLED", icon: Circle },
];

export default function Onboarding() {
  const { update } = useSettings();
  const { show } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState(20);
  const [theme, setTheme] = useState<ThemeMode>("system");
  const [wantsSamples, setWantsSamples] = useState(true);
  const [busy, setBusy] = useState(false);

  async function finish() {
    setBusy(true);
    await update({
      name: name.trim() || "Learner",
      dailyGoal: goal,
      theme,
      onboardingComplete: true,
    });
    if (wantsSamples) {
      try {
        await addSampleDecks();
        show("Sample decks added", "success");
      } catch {
        show("Couldn't add sample decks", "error");
      }
    }
    setBusy(false);
    navigate("/", { replace: true });
  }

  async function skip() {
    await update({ name: "Learner", onboardingComplete: true });
    navigate("/", { replace: true });
  }

  const steps = [
    <WelcomeStep key="welcome" onNext={() => setStep(1)} onSkip={skip} />,
    <NameStep key="name" name={name} setName={setName} onNext={() => setStep(2)} onBack={() => setStep(0)} />,
    <GoalStep key="goal" goal={goal} setGoal={setGoal} onNext={() => setStep(3)} onBack={() => setStep(1)} />,
    <ThemeStep key="theme" theme={theme} setTheme={setTheme} onNext={() => setStep(4)} onBack={() => setStep(2)} />,
    <ReadyStep
      key="ready"
      wantsSamples={wantsSamples}
      setWantsSamples={setWantsSamples}
      onFinish={finish}
      onBack={() => setStep(3)}
      busy={busy}
    />,
  ];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-lavender-50 via-white to-white px-6 py-10 dark:from-[#1a1524] dark:via-[#121018] dark:to-[#121018] amoled:from-black amoled:via-black amoled:to-black">
      <div className="w-full max-w-sm">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25 }}
          >
            {steps[step]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function WelcomeStep({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-lavender-500 to-lavender-700 text-white shadow-lg shadow-lavender-500/30">
        <BookOpenText className="h-10 w-10" />
      </div>
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Kotoba</h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">Learn words. Remember forever.</p>
      </div>
      <button
        onClick={onNext}
        className="mt-4 min-h-[52px] w-full rounded-2xl bg-lavender-600 text-base font-semibold text-white shadow-lg shadow-lavender-500/30 transition hover:bg-lavender-700"
      >
        Get Started
      </button>
      <button onClick={onSkip} className="text-sm font-medium text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
        Skip setup
      </button>
    </div>
  );
}

function NameStep({
  name,
  setName,
  onNext,
  onBack,
}: {
  name: string;
  setName: (v: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">What should we call you?</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Used only on this device, never shared.</p>
      </div>
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        className="min-h-[52px] rounded-2xl border border-zinc-200 bg-white px-4 text-base outline-none focus:border-lavender-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
      />
      <StepNav onNext={onNext} onBack={onBack} />
    </div>
  );
}

function GoalStep({
  goal,
  setGoal,
  onNext,
  onBack,
}: {
  goal: number;
  setGoal: (v: number) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Set your daily goal</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">You can change this anytime in Settings.</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {GOALS.map((g) => (
          <button
            key={g}
            onClick={() => setGoal(g)}
            className={`flex min-h-[76px] flex-col items-center justify-center gap-1 rounded-2xl border-2 text-lg font-bold transition ${
              goal === g
                ? "border-lavender-600 bg-lavender-50 text-lavender-700 dark:bg-lavender-500/10 dark:text-lavender-300"
                : "border-zinc-200 text-zinc-700 dark:border-white/10 dark:text-zinc-300"
            }`}
          >
            {g}
            <span className="text-[10px] font-normal uppercase tracking-wide opacity-60">cards/day</span>
          </button>
        ))}
      </div>
      <StepNav onNext={onNext} onBack={onBack} />
    </div>
  );
}

function ThemeStep({
  theme,
  setTheme,
  onNext,
  onBack,
}: {
  theme: ThemeMode;
  setTheme: (v: ThemeMode) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Choose your theme</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Kotoba looks great day or night.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {THEMES.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTheme(key)}
            className={`flex min-h-[76px] flex-col items-center justify-center gap-1.5 rounded-2xl border-2 transition ${
              theme === key
                ? "border-lavender-600 bg-lavender-50 text-lavender-700 dark:bg-lavender-500/10 dark:text-lavender-300"
                : "border-zinc-200 text-zinc-700 dark:border-white/10 dark:text-zinc-300"
            }`}
          >
            <Icon className="h-5 w-5" />
            <span className="text-sm font-semibold">{label}</span>
          </button>
        ))}
      </div>
      <StepNav onNext={onNext} onBack={onBack} />
    </div>
  );
}

function ReadyStep({
  wantsSamples,
  setWantsSamples,
  onFinish,
  onBack,
  busy,
}: {
  wantsSamples: boolean;
  setWantsSamples: (v: boolean) => void;
  onFinish: () => void;
  onBack: () => void;
  busy: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
        <Check className="h-8 w-8" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">You're ready.</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Would you like to add a few sample decks to explore Kotoba?
        </p>
      </div>
      <button
        onClick={() => setWantsSamples(!wantsSamples)}
        className={`flex w-full items-center justify-between rounded-2xl border-2 px-4 py-3.5 text-left transition ${
          wantsSamples ? "border-lavender-600 bg-lavender-50 dark:bg-lavender-500/10" : "border-zinc-200 dark:border-white/10"
        }`}
      >
        <div>
          <p className="font-semibold text-zinc-800 dark:text-zinc-100">Add sample decks</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Japanese N5 · Travel Japanese · Basic English</p>
        </div>
        <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${wantsSamples ? "border-lavender-600 bg-lavender-600" : "border-zinc-300"}`}>
          {wantsSamples && <Check className="h-4 w-4 text-white" />}
        </div>
      </button>
      <button
        disabled={busy}
        onClick={onFinish}
        className="min-h-[52px] w-full rounded-2xl bg-lavender-600 text-base font-semibold text-white shadow-lg shadow-lavender-500/30 transition hover:bg-lavender-700 disabled:opacity-60"
      >
        {busy ? "Setting up..." : "Start Learning"}
      </button>
      <button onClick={onBack} className="text-sm font-medium text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
        Back
      </button>
    </div>
  );
}

function StepNav({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  return (
    <div className="flex gap-3">
      <button
        onClick={onBack}
        className="min-h-[52px] flex-1 rounded-2xl bg-zinc-100 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-200 dark:bg-white/10 dark:text-zinc-300"
      >
        Back
      </button>
      <button
        onClick={onNext}
        className="min-h-[52px] flex-[2] rounded-2xl bg-lavender-600 text-sm font-semibold text-white transition hover:bg-lavender-700"
      >
        Continue
      </button>
    </div>
  );
}
