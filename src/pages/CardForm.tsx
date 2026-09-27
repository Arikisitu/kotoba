import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ImagePlus, X } from "lucide-react";
import { Shell } from "../components/Shell";
import { TopBar } from "../components/ui/TopBar";
import { TagChip } from "../components/ui/TagChip";
import { useCard, useDecks } from "../hooks/useKotobaData";
import { createCard, updateCard, getDeck } from "../db/repository";
import { useToast } from "../context/ToastContext";

export default function CardForm({ mode }: { mode: "create" | "edit" }) {
  const { deckId: paramDeckId, cardId } = useParams();
  const navigate = useNavigate();
  const { show } = useToast();
  const decks = useDecks() ?? [];
  const existing = useCard(mode === "edit" ? cardId : undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [deckId, setDeckId] = useState(paramDeckId ?? "");
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [reading, setReading] = useState("");
  const [romaji, setRomaji] = useState("");
  const [meaning, setMeaning] = useState("");
  const [exampleSentence, setExampleSentence] = useState("");
  const [exampleTranslation, setExampleTranslation] = useState("");
  const [notes, setNotes] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existing) {
      setDeckId(existing.deckId);
      setFront(existing.front);
      setBack(existing.back);
      setReading(existing.reading);
      setRomaji(existing.romaji);
      setMeaning(existing.meaning);
      setExampleSentence(existing.exampleSentence);
      setExampleTranslation(existing.exampleTranslation);
      setNotes(existing.notes);
      setTags(existing.tags);
      setImageUrl(existing.imageUrl ?? "");
    }
  }, [existing]);

  useEffect(() => {
    if (mode === "create" && !deckId && decks.length > 0) setDeckId(decks[0].id);
  }, [decks, deckId, mode]);

  function addTag() {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      show("Please choose a valid image file.", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImageUrl(reader.result as string);
    reader.onerror = () => show("Couldn't load this image.", "error");
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    if (!front.trim() || !back.trim()) {
      show("Front and Back are required.", "error");
      return;
    }
    if (!deckId) {
      show("Please choose a deck for this card.", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        deckId,
        front,
        back,
        reading,
        romaji,
        meaning,
        exampleSentence,
        exampleTranslation,
        notes,
        tags,
        imageUrl,
      };
      if (mode === "create") {
        await createCard(payload);
        show("Card added", "success");
      } else if (cardId) {
        await updateCard(cardId, payload);
        show("Card updated", "success");
      }
      const deck = await getDeck(deckId);
      navigate(deck ? `/deck/${deckId}` : "/library", { replace: true });
    } catch {
      show("Something went wrong while saving this card.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Shell withNav={false}>
      <TopBar title={mode === "create" ? "New Card" : "Edit Card"} />
      <div className="flex flex-col gap-5 px-5 py-5 pb-10">
        <Field label="Deck *">
          <select
            value={deckId}
            onChange={(e) => setDeckId(e.target.value)}
            className="min-h-[52px] rounded-2xl border border-zinc-200 bg-white px-4 text-base outline-none focus:border-lavender-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
          >
            {decks.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Front *">
          <input autoFocus value={front} onChange={(e) => setFront(e.target.value)} placeholder="猫" className={inputClass} />
        </Field>
        <Field label="Back *">
          <input value={back} onChange={(e) => setBack(e.target.value)} placeholder="Cat" className={inputClass} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Reading">
            <input value={reading} onChange={(e) => setReading(e.target.value)} placeholder="ねこ" className={inputClass} />
          </Field>
          <Field label="Romaji">
            <input value={romaji} onChange={(e) => setRomaji(e.target.value)} placeholder="Neko" className={inputClass} />
          </Field>
        </div>
        <Field label="Meaning">
          <input value={meaning} onChange={(e) => setMeaning(e.target.value)} placeholder="Cat" className={inputClass} />
        </Field>
        <Field label="Example Sentence">
          <textarea value={exampleSentence} onChange={(e) => setExampleSentence(e.target.value)} placeholder="猫が好きです。" rows={2} className={textareaClass} />
        </Field>
        <Field label="Example Translation">
          <textarea value={exampleTranslation} onChange={(e) => setExampleTranslation(e.target.value)} placeholder="I like cats." rows={2} className={textareaClass} />
        </Field>
        <Field label="Notes">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" rows={2} className={textareaClass} />
        </Field>
        <Field label="Tags">
          <div className="flex flex-wrap items-center gap-2">
            {tags.map((t) => (
              <TagChip key={t} label={t} removable onRemove={() => setTags(tags.filter((x) => x !== t))} />
            ))}
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addTag();
                }
              }}
              onBlur={addTag}
              placeholder="Add tag..."
              className="min-h-[36px] flex-1 rounded-full bg-transparent px-2 text-sm outline-none"
            />
          </div>
        </Field>
        <Field label="Image (optional)">
          {imageUrl ? (
            <div className="relative w-fit">
              <img src={imageUrl} alt="Card visual" className="h-28 w-28 rounded-2xl object-cover" />
              <button
                onClick={() => setImageUrl("")}
                aria-label="Remove image"
                className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex h-28 w-28 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-zinc-300 text-zinc-400 dark:border-white/15"
            >
              <ImagePlus className="h-6 w-6" />
              <span className="text-xs">Add image</span>
            </button>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
        </Field>

        <button
          disabled={saving || decks.length === 0}
          onClick={handleSave}
          className="mt-2 min-h-[52px] w-full rounded-2xl bg-lavender-600 text-base font-semibold text-white shadow-lg shadow-lavender-500/30 hover:bg-lavender-700 disabled:opacity-60"
        >
          {decks.length === 0 ? "Create a deck first" : saving ? "Saving..." : "Save Card"}
        </button>
      </div>
    </Shell>
  );
}

const inputClass =
  "min-h-[52px] rounded-2xl border border-zinc-200 bg-white px-4 text-base outline-none focus:border-lavender-500 dark:border-white/10 dark:bg-white/5 dark:text-white";
const textareaClass =
  "rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-base outline-none focus:border-lavender-500 dark:border-white/10 dark:bg-white/5 dark:text-white";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{label}</span>
      {children}
    </label>
  );
}
