import { useState } from "react";
import { motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import { Volume2, Star } from "lucide-react";
import type { Rating } from "../db/types";
import type { VocabCard } from "../db/types";
import { speak } from "../lib/tts";
import { useToast } from "../context/ToastContext";
import { toggleFavorite } from "../db/repository";

interface SwipeCardProps {
  card: VocabCard;
  deckLanguage: string;
  revealed: boolean;
  onReveal: () => void;
  onRate: (rating: Rating) => void;
  onSkip: () => void;
  ttsEnabled: boolean;
}

const SWIPE_THRESHOLD = 110;

export function SwipeCard({ card, deckLanguage, revealed, onReveal, onRate, onSkip, ttsEnabled }: SwipeCardProps) {
  const { show } = useToast();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-220, 0, 220], [-18, 0, 18]);
  const [dragging, setDragging] = useState(false);
  const [favorite, setFavorite] = useState(card.isFavorite);

  const rightOpacity = useTransform(x, [20, 140], [0, 1]);
  const leftOpacity = useTransform(x, [-140, -20], [1, 0]);
  const upOpacity = useTransform(y, [-140, -20], [1, 0]);
  const downOpacity = useTransform(y, [20, 140], [0, 1]);

  function handleDragEnd(_: unknown, info: PanInfo) {
    setDragging(false);
    const { offset } = info;
    const absX = Math.abs(offset.x);
    const absY = Math.abs(offset.y);

    if (!revealed) {
      // Reveal instead of rating when the answer hasn't been shown yet.
      x.set(0);
      y.set(0);
      if (absX > 40 || absY > 40) onReveal();
      return;
    }

    if (absX > absY && absX > SWIPE_THRESHOLD) {
      onRate(offset.x > 0 ? "easy" : "again");
      return;
    }
    if (absY > absX && absY > SWIPE_THRESHOLD) {
      if (offset.y < 0) onRate("good");
      else onSkip();
      return;
    }
    x.set(0);
    y.set(0);
  }

  function speakText(text: string, lang: "ja-JP" | "en-US") {
    speak(text, lang, (msg) => show(msg, "info"));
  }

  async function handleFavorite(e: React.MouseEvent) {
    e.stopPropagation();
    setFavorite((f) => !f);
    await toggleFavorite(card.id);
  }

  const isJapanese = deckLanguage.toLowerCase().includes("japan") || /[\u3040-\u30ff\u4e00-\u9faf]/.test(card.front);

  return (
    <div className="relative flex h-[420px] w-full items-center justify-center" style={{ perspective: 1200 }}>
      <motion.div
        drag
        dragElastic={0.6}
        style={{ x, y, rotate }}
        onDragStart={() => setDragging(true)}
        onDragEnd={handleDragEnd}
        whileTap={{ scale: 0.98 }}
        animate={dragging ? undefined : { x: 0, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
        className="absolute h-full w-full cursor-grab active:cursor-grabbing"
      >
        {/* Direction indicators */}
        <motion.div style={{ opacity: rightOpacity }} className="pointer-events-none absolute right-5 top-8 z-20 -rotate-12 rounded-xl border-4 border-emerald-500 px-3 py-1 text-xl font-black text-emerald-500">
          EASY
        </motion.div>
        <motion.div style={{ opacity: leftOpacity }} className="pointer-events-none absolute left-5 top-8 z-20 rotate-12 rounded-xl border-4 border-rose-500 px-3 py-1 text-xl font-black text-rose-500">
          AGAIN
        </motion.div>
        <motion.div style={{ opacity: upOpacity }} className="pointer-events-none absolute left-1/2 top-4 z-20 -translate-x-1/2 rounded-xl border-4 border-lavender-500 px-3 py-1 text-xl font-black text-lavender-500">
          GOOD
        </motion.div>
        <motion.div style={{ opacity: downOpacity }} className="pointer-events-none absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-xl border-4 border-zinc-400 px-3 py-1 text-xl font-black text-zinc-400">
          SKIP
        </motion.div>

        <motion.div
          onClick={() => !revealed && onReveal()}
          className="h-full w-full [transform-style:preserve-3d]"
          animate={{ rotateY: revealed ? 180 : 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* FRONT */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-[2rem] border border-black/5 bg-white p-8 text-center shadow-xl dark:border-white/10 dark:bg-zinc-900 amoled:border-white/10 amoled:bg-zinc-950 [backface-visibility:hidden]"
          >
            <button
              onClick={handleFavorite}
              aria-label="Toggle favorite"
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10"
            >
              <Star className={`h-5 w-5 ${favorite ? "fill-amber-400 text-amber-400" : ""}`} />
            </button>
            <span className="text-5xl font-semibold text-zinc-900 dark:text-white break-words">{card.front}</span>
            {ttsEnabled && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  speakText(card.front, isJapanese ? "ja-JP" : "en-US");
                }}
                aria-label="Listen to pronunciation"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-lavender-50 text-lavender-600 dark:bg-white/10 dark:text-lavender-300"
              >
                <Volume2 className="h-5 w-5" />
              </button>
            )}
            <p className="absolute bottom-7 text-xs font-medium uppercase tracking-widest text-zinc-400">Tap to reveal</p>
          </div>

          {/* BACK */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 overflow-y-auto rounded-[2rem] border border-black/5 bg-white p-7 text-center shadow-xl dark:border-white/10 dark:bg-zinc-900 amoled:border-white/10 amoled:bg-zinc-950 [backface-visibility:hidden] [transform:rotateY(180deg)]"
          >
            <span className="text-3xl font-semibold text-zinc-900 dark:text-white break-words">{card.front}</span>
            {card.reading && <span className="text-lg text-zinc-500 dark:text-zinc-400">{card.reading}</span>}
            {card.romaji && <span className="text-sm italic text-lavender-500 dark:text-lavender-300">{card.romaji}</span>}
            <div className="my-1 h-px w-16 bg-zinc-200 dark:bg-white/10" />
            <span className="text-xl font-medium text-lavender-700 dark:text-lavender-200">{card.back || card.meaning}</span>
            {card.exampleSentence && (
              <div className="mt-2 space-y-1 rounded-xl bg-zinc-50 px-4 py-3 text-sm dark:bg-white/5">
                <p className="text-zinc-700 dark:text-zinc-200">{card.exampleSentence}</p>
                {card.exampleTranslation && <p className="text-zinc-400">{card.exampleTranslation}</p>}
              </div>
            )}
            {ttsEnabled && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  speakText(card.front, isJapanese ? "ja-JP" : "en-US");
                }}
                aria-label="Listen to pronunciation"
                className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-lavender-50 text-lavender-600 dark:bg-white/10 dark:text-lavender-300"
              >
                <Volume2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
