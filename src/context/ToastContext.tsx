import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

type ToastKind = "success" | "error" | "info";
interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastContextValue {
  show: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

let counter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const show = useCallback((message: string, kind: ToastKind = "info") => {
    const id = ++counter;
    setToasts((prev) => [...prev, { id, kind, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  const dismiss = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-4">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.96 }}
              className="pointer-events-auto flex w-full max-w-sm items-start gap-2 rounded-2xl border border-black/5 bg-white/95 px-4 py-3 text-sm shadow-lg backdrop-blur dark:border-white/10 dark:bg-zinc-900/95 amoled:bg-black/95"
            >
              {t.kind === "success" && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />}
              {t.kind === "error" && <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />}
              {t.kind === "info" && <Info className="mt-0.5 h-4 w-4 shrink-0 text-lavender-500" />}
              <span className="flex-1 text-zinc-700 dark:text-zinc-200">{t.message}</span>
              <button onClick={() => dismiss(t.id)} aria-label="Dismiss" className="text-zinc-400 hover:text-zinc-600">
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
