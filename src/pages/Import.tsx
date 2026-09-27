import { useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FileUp, CheckCircle2, ArrowRight } from "lucide-react";
import { Shell } from "../components/Shell";
import { TopBar } from "../components/ui/TopBar";
import {
  KOTOBA_FIELDS,
  autoMapColumns,
  importRowsToDeck,
  parseImportFile,
  type KotobaFieldKey,
  type ParsedFile,
} from "../db/importExport";
import { createDeck } from "../db/repository";
import { useDecks } from "../hooks/useKotobaData";
import { useToast } from "../context/ToastContext";

type Step = "select" | "map" | "result";

export default function Import() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { show } = useToast();
  const decks = useDecks() ?? [];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("select");
  const [parsed, setParsed] = useState<ParsedFile | null>(null);
  const [mapping, setMapping] = useState<Record<KotobaFieldKey, number | null> | null>(null);
  const [deckId, setDeckId] = useState(params.get("deckId") ?? "");
  const [newDeckName, setNewDeckName] = useState("");
  const [creatingNewDeck, setCreatingNewDeck] = useState(decks.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; skippedDuplicates: number; skippedInvalid: number } | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    try {
      const result = await parseImportFile(file);
      setParsed(result);
      setMapping(autoMapColumns(result.headers));
      setStep("map");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't import this file.");
      show(err instanceof Error ? err.message : "Couldn't import this file.", "error");
    }
  }

  async function handleImport() {
    if (!parsed || !mapping) return;
    let targetDeckId = deckId;
    setImporting(true);
    try {
      if (creatingNewDeck) {
        if (!newDeckName.trim()) {
          show("Please name your new deck.", "error");
          setImporting(false);
          return;
        }
        const deck = await createDeck({ name: newDeckName, language: "General" });
        targetDeckId = deck.id;
      }
      if (!targetDeckId) {
        show("Please choose a deck to import into.", "error");
        setImporting(false);
        return;
      }
      const res = await importRowsToDeck(targetDeckId, parsed.rows, mapping);
      setResult(res);
      setStep("result");
    } catch (err) {
      show(err instanceof Error ? err.message : "Import failed unexpectedly.", "error");
    } finally {
      setImporting(false);
    }
  }

  return (
    <Shell withNav={false}>
      <TopBar title="Import Vocabulary" />
      <div className="flex flex-col gap-5 px-5 py-5 pb-10">
        {step === "select" && (
          <>
            <div className="rounded-2xl border border-black/5 bg-white p-5 text-sm text-zinc-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-400">
              <p className="font-semibold text-zinc-800 dark:text-zinc-100">Supported formats</p>
              <p className="mt-1">CSV or TXT/TSV files with columns such as:</p>
              <code className="mt-2 block rounded-lg bg-zinc-100 p-2 text-xs dark:bg-black/30">Front,Back,Reading,Romaji,Meaning</code>
              <p className="mt-2 text-xs">.apkg (Anki package) import is not yet supported — export your Anki deck as plain text/CSV first.</p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-lavender-300 bg-lavender-50 py-10 text-lavender-600 dark:border-lavender-500/30 dark:bg-lavender-500/5 dark:text-lavender-300"
            >
              <FileUp className="h-8 w-8" />
              <span className="font-semibold">Select a file</span>
              <span className="text-xs opacity-70">.csv, .txt, .tsv</span>
            </button>
            {error && <p className="text-sm text-rose-500">{error}</p>}
            <input ref={fileInputRef} type="file" accept=".csv,.txt,.tsv" className="hidden" onChange={handleFile} />
          </>
        )}

        {step === "map" && parsed && mapping && (
          <>
            <div className="rounded-2xl border border-black/5 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Preview ({parsed.rows.length} rows found)</p>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr>
                      {parsed.headers.map((h, i) => (
                        <th key={i} className="whitespace-nowrap px-2 py-1 font-semibold text-zinc-500">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.rows.slice(0, 3).map((row, ri) => (
                      <tr key={ri} className="border-t border-black/5 dark:border-white/10">
                        {row.map((cell, ci) => (
                          <td key={ci} className="whitespace-nowrap px-2 py-1 text-zinc-600 dark:text-zinc-300">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl border border-black/5 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">Map columns</p>
              <div className="flex flex-col gap-3">
                {KOTOBA_FIELDS.map((f) => (
                  <div key={f.key} className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">{f.label}</span>
                    <select
                      value={mapping[f.key] ?? ""}
                      onChange={(e) =>
                        setMapping({ ...mapping, [f.key]: e.target.value === "" ? null : Number(e.target.value) })
                      }
                      className="min-h-[40px] rounded-lg border border-zinc-200 bg-white px-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white"
                    >
                      <option value="">— None —</option>
                      {parsed.headers.map((h, i) => (
                        <option key={i} value={i}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-black/5 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">Import into</p>
              {decks.length > 0 && (
                <div className="mb-2 flex rounded-xl bg-zinc-100 p-1 text-xs dark:bg-white/10">
                  <button
                    onClick={() => setCreatingNewDeck(false)}
                    className={`flex-1 rounded-lg py-2 font-semibold ${!creatingNewDeck ? "bg-white shadow dark:bg-zinc-900" : "text-zinc-500"}`}
                  >
                    Existing deck
                  </button>
                  <button
                    onClick={() => setCreatingNewDeck(true)}
                    className={`flex-1 rounded-lg py-2 font-semibold ${creatingNewDeck ? "bg-white shadow dark:bg-zinc-900" : "text-zinc-500"}`}
                  >
                    New deck
                  </button>
                </div>
              )}
              {creatingNewDeck ? (
                <input
                  value={newDeckName}
                  onChange={(e) => setNewDeckName(e.target.value)}
                  placeholder="New deck name"
                  className="min-h-[48px] w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              ) : (
                <select
                  value={deckId}
                  onChange={(e) => setDeckId(e.target.value)}
                  className="min-h-[48px] w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white"
                >
                  <option value="">Select a deck...</option>
                  {decks.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <button
              disabled={importing}
              onClick={handleImport}
              className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-lavender-600 text-base font-semibold text-white shadow-lg shadow-lavender-500/30 hover:bg-lavender-700 disabled:opacity-60"
            >
              {importing ? "Importing..." : "Import"} <ArrowRight className="h-4 w-4" />
            </button>
          </>
        )}

        {step === "result" && result && (
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Successfully imported {result.imported} cards.</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {result.skippedDuplicates > 0 && `${result.skippedDuplicates} duplicates skipped. `}
              {result.skippedInvalid > 0 && `${result.skippedInvalid} invalid rows skipped.`}
            </p>
            <button
              onClick={() => navigate("/library")}
              className="min-h-[48px] rounded-2xl bg-lavender-600 px-6 text-sm font-semibold text-white hover:bg-lavender-700"
            >
              Go to Library
            </button>
          </div>
        )}
      </div>
    </Shell>
  );
}
