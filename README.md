# Kotoba

A free, offline-first vocabulary learning app inspired by Anki and swipe-based (Tinder-style) learning.

> **Important note on this build**: the original brief asked for a native Android/Kotlin/Gradle app. This
> workspace's toolchain only supports building **React + Vite + TypeScript + Tailwind CSS** web apps — there is
> no Android SDK, Gradle, or Kotlin compiler available here. Every feature below has instead been implemented as
> a real, fully-functional **offline-first Progressive Web App** that runs in any modern mobile or desktop
> browser (and installs to a home screen), so the Kotoba experience, data model, and spaced-repetition logic are
> genuinely working end-to-end rather than mocked. See **Limitations** for the handful of things that need a
> native shell (e.g. Kotlin/Compose) to be 100% platform-idiomatic.

## Features

- 🔁 **Real spaced repetition** — an Anki-inspired SM-2 style scheduler (learning steps, graduating interval,
  ease factor, lapses, relearning) drives every card's next-review date. Nothing is randomly shown.
- 👆 **Tinder-style swipe review** — drag cards left/right/up/down with spring physics, rotation, live direction
  labels (AGAIN / EASY / GOOD / SKIP), plus always-visible Again/Hard/Good/Easy buttons for accessibility.
- 🃏 **3D flip card** — tap to flip front → back with a smooth animated 3D rotation revealing reading, romaji,
  meaning, and example sentence.
- 📚 **Unlimited custom decks** with manual card creation (front, back, reading, romaji, meaning, example
  sentence + translation, notes, tags, optional image).
- ✏️ **Edit / delete / duplicate / move** cards between decks, with confirmation dialogs before destructive
  actions.
- 📥 **CSV / TXT / TSV import** with column-mapping preview, duplicate + invalid row detection, and friendly
  error messages for corrupt/unsupported files. (`.apkg` import is intentionally not faked — see Limitations.)
- 📤 **CSV / TXT export** per deck using a real downloadable file, plus a full JSON **backup & restore** of the
  entire local database.
- 🌱 **Optional sample decks** (Japanese N5, Travel Japanese, Basic English) offered on first launch.
- 🔥 **Daily streaks**, configurable **daily goal**, and a full **history** log grouped by day.
- 📊 **Statistics** — total/learned/reviewed cards, 7/30-day activity chart, again/hard/good/easy breakdown,
  per-deck progress, total study time.
- ⭐ **Favorites** and **tags** with filtering, plus a global vocabulary **search** across front/back/reading/
  romaji/meaning/tags.
- 🔊 **Text-to-speech pronunciation** via the Web Speech API (`ja-JP` / `en-US`), with graceful fallback
  messaging if a voice isn't available.
- 🔔 **Daily reminder notifications** (Notification API) with a real permission flow and test-notification
  button.
- 🎨 **Light / Dark / AMOLED / System** themes with a lavender/purple, minimalist, Japanese-inspired identity.
- 🔒 **100% offline, no login, no backend, no analytics, no ads.** All data lives in IndexedDB on-device.

## Tech Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4
- Dexie.js (IndexedDB) as the offline "Room-equivalent" database + `dexie-react-hooks` for reactive live queries
- Framer Motion for drag/flip/page animations
- React Router (Hash routing, fully client-side)
- PapaParse for CSV/TSV parsing
- Web Speech API for TTS, Notification API for reminders
- lucide-react icon set

## Architecture

```
src/
  db/
    types.ts          # Deck, VocabCard, ReviewLog, StudySession, UserSettings models
    db.ts              # Dexie database + table schema (Room-equivalent)
    scheduler.ts        # Anki-inspired SM-2 spaced repetition algorithm
    repository.ts        # All read/write operations (decks, cards, reviews, sessions, settings)
    importExport.ts       # CSV/TXT import + export, column mapping, APKG stub
    backup.ts               # Full JSON backup / restore
    sampleData.ts             # Optional first-launch sample decks
  context/               # SettingsContext (theme/prefs) + ToastContext (user-friendly errors)
  hooks/                  # useKotobaData.ts — live Dexie queries + stat helpers
  lib/                     # tts.ts, notifications.ts, statsUtils.ts, homeUtils.ts
  components/               # Reusable UI: SwipeCard, ReviewButtons, DeckCard, TopBar, BottomNav,
                              ProgressBar, StatCard, EmptyState, TagChip, SearchBar, ConfirmDialog, ActionSheet
  pages/                      # One screen per route (Home, Learn, Library, DeckDetail, Card/Deck forms,
                                Statistics, History, Settings, Import, Favorites, Onboarding)
  App.tsx                      # Router + onboarding gate + providers
```

This mirrors the requested clean/MVVM-style separation: **entities → repository → reactive hooks → screens**,
with no direct database calls inside components other than through the hooks/repository layer.

## Build & Run

```bash
npm install
npm run dev       # local dev server
npm run build     # production build → dist/
npm run preview   # preview the production build
```

The production build is a single self-contained `dist/index.html` (via `vite-plugin-singlefile`), so it can be
opened directly or hosted on any static file host. Because it's a PWA-style offline app, it also works after
disabling your network connection once loaded.

## Verified User Flow

Install → open Kotoba → complete onboarding → create deck "Japanese N5" → add card "猫" (ねこ / Neko / Cat) →
save → open deck → Start Learning → see card → tap to flip → swipe right → card scheduled as Easy → next card
→ finish session → statistics update → close app → reopen → data persists (IndexedDB) → open Library → deck
still exists → search "Neko" → card appears → edit card → save → export deck (CSV) → re-import the exported
CSV → no crash, duplicates are detected and skipped.

## Limitations

- **Not a native Android binary.** This is a web implementation; there is no `.apk`/`.aab` output and no
  `./gradlew assembleDebug` step, because no Android/Kotlin toolchain is available in this environment. Every
  feature was instead implemented as real, working web logic (not a static mockup).
- **`.apkg` import** is deliberately not "faked". Full APKG support requires unzipping the package and reading
  the embedded SQLite collection — the CSV/TSV importer is structured (see `db/importExport.ts`) so a
  `parseApkgFile()` implementation using a SQLite-in-JS reader can be dropped in later without touching the
  rest of the import pipeline.
- **Background notifications** use the browser Notification API with an in-app scheduler; true OS-level
  background alarms (like Android's AlarmManager) require a native shell or a push server, which this
  offline-only, backend-free app intentionally does not use.
- Charts are custom-drawn with Tailwind/CSS (per the "avoid heavy chart libraries" guidance) rather than a
  charting library.

## Privacy

Kotoba stores everything locally in your browser's IndexedDB. There is no account, no server, no analytics,
and no ads. Backups are plain JSON files you export/import yourself.

## Contributing

Issues and pull requests are welcome. Please keep new features offline-first and dependency-light in the spirit
of the project.

## License

MIT — see [LICENSE](./LICENSE).

## Android APK — no Android Studio required

This repository can also be packaged as an Android app with Capacitor.

1. Push this repository to GitHub.
2. Open **Actions**.
3. Select **Build Kotoba Android APK**.
4. Click **Run workflow**.
5. Open the completed workflow run and download the `kotoba-release-apk` artifact.

The APK is built on GitHub's hosted runner; Android Studio is not required on your computer.
