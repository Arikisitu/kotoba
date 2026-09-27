import Papa from "papaparse";
import { db } from "./db";
import { createCard, getDeckCards } from "./repository";
import type { VocabCard } from "./types";

export interface ParsedFile {
  headers: string[];
  rows: string[][];
  delimiter: string;
}

export class ImportError extends Error {}

const KOTOBA_FIELDS = [
  { key: "front", label: "Front" },
  { key: "back", label: "Back" },
  { key: "reading", label: "Reading" },
  { key: "romaji", label: "Romaji" },
  { key: "meaning", label: "Meaning" },
  { key: "exampleSentence", label: "Example Sentence" },
  { key: "exampleTranslation", label: "Example Translation" },
  { key: "notes", label: "Notes" },
  { key: "tags", label: "Tags" },
] as const;

export type KotobaFieldKey = (typeof KOTOBA_FIELDS)[number]["key"];
export { KOTOBA_FIELDS };

/** Parse a CSV or TSV/TXT file into headers + rows. Throws ImportError on invalid/corrupt input. */
export async function parseImportFile(file: File): Promise<ParsedFile> {
  if (!file) throw new ImportError("No file was selected.");
  const validExt = /\.(csv|txt|tsv)$/i.test(file.name);
  if (!validExt) {
    throw new ImportError("Unsupported format. Please choose a .csv or .txt vocabulary file.");
  }
  if (file.size === 0) {
    throw new ImportError("This file is empty. Please choose a file that contains vocabulary rows.");
  }
  const text = await file.text().catch(() => {
    throw new ImportError("Couldn't read this file. It may be corrupt.");
  });
  if (!text || !text.trim()) {
    throw new ImportError("This file is empty. Please choose a file that contains vocabulary rows.");
  }

  const delimiter = guessDelimiter(text);
  const result = Papa.parse<string[]>(text, {
    delimiter,
    skipEmptyLines: true,
  });

  if (result.errors.length && (!result.data || result.data.length === 0)) {
    throw new ImportError("Couldn't import this file. Please check that it is a valid CSV or TXT vocabulary file.");
  }

  const rows = (result.data as string[][]).filter((r) => r.some((cell) => cell && cell.trim() !== ""));
  if (rows.length === 0) {
    throw new ImportError("No vocabulary rows were found in this file.");
  }

  // Detect header row heuristically: if first row contains "front"/"back" (case-insensitive)
  const first = rows[0].map((c) => c.trim().toLowerCase());
  const looksLikeHeader = first.includes("front") || first.includes("back");
  const headers = looksLikeHeader ? rows[0] : rows[0].map((_, i) => `Column ${i + 1}`);
  const dataRows = looksLikeHeader ? rows.slice(1) : rows;

  if (dataRows.length === 0) {
    throw new ImportError("This file only contains a header row with no vocabulary data.");
  }

  return { headers, rows: dataRows, delimiter };
}

function guessDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;
  if (tabCount > commaCount) return "\t";
  return ",";
}

/** Auto-guess a column mapping based on header names. */
export function autoMapColumns(headers: string[]): Record<KotobaFieldKey, number | null> {
  const mapping: Record<KotobaFieldKey, number | null> = {
    front: null,
    back: null,
    reading: null,
    romaji: null,
    meaning: null,
    exampleSentence: null,
    exampleTranslation: null,
    notes: null,
    tags: null,
  };
  const normalized = headers.map((h) => h.trim().toLowerCase());
  const findIdx = (aliases: string[]) => normalized.findIndex((h) => aliases.includes(h));

  mapping.front = idxOrNull(findIdx(["front", "japanese", "word", "term"]));
  mapping.back = idxOrNull(findIdx(["back", "translation", "answer"]));
  mapping.reading = idxOrNull(findIdx(["reading", "furigana", "kana"]));
  mapping.romaji = idxOrNull(findIdx(["romaji", "romanization"]));
  mapping.meaning = idxOrNull(findIdx(["meaning", "definition"]));
  mapping.exampleSentence = idxOrNull(findIdx(["example", "examplesentence", "example sentence", "sentence"]));
  mapping.exampleTranslation = idxOrNull(findIdx(["exampletranslation", "example translation", "sentence translation"]));
  mapping.notes = idxOrNull(findIdx(["notes", "note"]));
  mapping.tags = idxOrNull(findIdx(["tags", "tag"]));

  // Fallback: if front/back not found by name, assume first two columns
  if (mapping.front === null && headers.length > 0) mapping.front = 0;
  if (mapping.back === null && headers.length > 1) mapping.back = 1;

  return mapping;
}

function idxOrNull(i: number): number | null {
  return i === -1 ? null : i;
}

export interface ImportResult {
  imported: number;
  skippedDuplicates: number;
  skippedInvalid: number;
  total: number;
}

/** Import parsed rows into a deck using the given column mapping. Skips duplicates and invalid rows. */
export async function importRowsToDeck(
  deckId: string,
  rows: string[][],
  mapping: Record<KotobaFieldKey, number | null>
): Promise<ImportResult> {
  const existing = await getDeckCards(deckId);
  const existingKeys = new Set(existing.map((c) => keyFor(c.front, c.back)));

  let imported = 0;
  let skippedDuplicates = 0;
  let skippedInvalid = 0;

  for (const row of rows) {
    const get = (key: KotobaFieldKey) => {
      const idx = mapping[key];
      if (idx === null || idx === undefined || idx >= row.length) return "";
      return (row[idx] ?? "").trim();
    };
    const front = get("front");
    const back = get("back");
    if (!front || !back) {
      skippedInvalid += 1;
      continue;
    }
    const key = keyFor(front, back);
    if (existingKeys.has(key)) {
      skippedDuplicates += 1;
      continue;
    }
    const tagsRaw = get("tags");
    const tags = tagsRaw
      ? tagsRaw.split(/[;,]/).map((t) => t.trim()).filter(Boolean)
      : [];
    await createCard({
      deckId,
      front,
      back,
      reading: get("reading"),
      romaji: get("romaji"),
      meaning: get("meaning"),
      exampleSentence: get("exampleSentence"),
      exampleTranslation: get("exampleTranslation"),
      notes: get("notes"),
      tags,
    });
    existingKeys.add(key);
    imported += 1;
  }

  return { imported, skippedDuplicates, skippedInvalid, total: rows.length };
}

function keyFor(front: string, back: string) {
  return `${front.trim().toLowerCase()}::${back.trim().toLowerCase()}`;
}

// ---------- Export ----------
const EXPORT_HEADER = [
  "Front",
  "Back",
  "Reading",
  "Romaji",
  "Meaning",
  "ExampleSentence",
  "ExampleTranslation",
  "Notes",
  "Tags",
];

function cardToRow(c: VocabCard): string[] {
  return [
    c.front,
    c.back,
    c.reading,
    c.romaji,
    c.meaning,
    c.exampleSentence,
    c.exampleTranslation,
    c.notes,
    c.tags.join(";"),
  ];
}

export async function exportDeckAsCSV(deckId: string, deckName: string): Promise<void> {
  const cards = await getDeckCards(deckId);
  const csv = Papa.unparse([EXPORT_HEADER, ...cards.map(cardToRow)]);
  downloadFile(csv, `${sanitizeFilename(deckName)}.csv`, "text/csv;charset=utf-8;");
}

export async function exportDeckAsTXT(deckId: string, deckName: string): Promise<void> {
  const cards = await getDeckCards(deckId);
  const lines = [EXPORT_HEADER.join("\t"), ...cards.map((c) => cardToRow(c).join("\t"))];
  downloadFile(lines.join("\n"), `${sanitizeFilename(deckName)}.txt`, "text/plain;charset=utf-8;");
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9_\- ]/gi, "").trim().replace(/\s+/g, "_") || "kotoba_deck";
}

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob(["\uFEFF" + content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// APKG (Anki package) support note:
// Full .apkg import requires unzipping the package and reading the embedded
// SQLite database (collection.anki2/anki21) to extract notes + cards, then
// mapping Anki note fields to Kotoba fields. The CSV/TXT importer above is
// structured so that once a SQLite reader (e.g. sql.js) is bundled, an
// `parseApkgFile(file): Promise<ParsedFile>` function can produce the same
// { headers, rows } shape and reuse `importRowsToDeck` unchanged.
export async function parseApkgFile(_file: File): Promise<ParsedFile> {
  throw new ImportError(
    "APKG import isn't available in this build yet. Please export your Anki deck as CSV or TXT (File → Export → Notes in Plain Text) and import that instead."
  );
}

// db import used to keep this module self-contained if referenced elsewhere
export const _internalDb = db;
