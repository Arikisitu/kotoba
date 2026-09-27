import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Shell } from "../components/Shell";
import { TopBar } from "../components/ui/TopBar";
import { useDeck } from "../hooks/useKotobaData";
import { createDeck, updateDeck } from "../db/repository";
import { useToast } from "../context/ToastContext";

const LANGUAGES = ["Japanese", "English", "Spanish", "French", "Korean", "Chinese", "General"];

export default function DeckForm({ mode }: { mode: "create" | "edit" }) {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const { show } = useToast();
  const existing = useDeck(mode === "edit" ? deckId : undefined);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("Japanese");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setDescription(existing.description);
      setLanguage(existing.language);
    }
  }, [existing]);

  async function handleSave() {
    if (!name.trim()) {
      show("Please give your deck a name.", "error");
      return;
    }
    setSaving(true);
    try {
      if (mode === "create") {
        const deck = await createDeck({ name, description, language });
        show("Deck created", "success");
        navigate(`/deck/${deck.id}`, { replace: true });
      } else if (deckId) {
        await updateDeck(deckId, { name, description, language });
        show("Deck updated", "success");
        navigate(`/deck/${deckId}`, { replace: true });
      }
    } catch {
      show("Something went wrong while saving this deck.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Shell withNav={false}>
      <TopBar title={mode === "create" ? "New Deck" : "Edit Deck"} />
      <div className="flex flex-col gap-5 px-5 py-5">
        <Field label="Deck Name *">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Japanese N5"
            className="min-h-[52px] rounded-2xl border border-zinc-200 bg-white px-4 text-base outline-none focus:border-lavender-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
          />
        </Field>
        <Field label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this deck about?"
            rows={3}
            className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-base outline-none focus:border-lavender-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
          />
        </Field>
        <Field label="Language">
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  language === lang
                    ? "bg-lavender-600 text-white"
                    : "bg-zinc-100 text-zinc-600 dark:bg-white/10 dark:text-zinc-300"
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </Field>
        <button
          disabled={saving}
          onClick={handleSave}
          className="mt-2 min-h-[52px] w-full rounded-2xl bg-lavender-600 text-base font-semibold text-white shadow-lg shadow-lavender-500/30 hover:bg-lavender-700 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Deck"}
        </button>
      </div>
    </Shell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{label}</span>
      {children}
    </label>
  );
}
