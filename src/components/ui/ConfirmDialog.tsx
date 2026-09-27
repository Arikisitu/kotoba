import { AnimatePresence, motion } from "framer-motion";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
        >
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl dark:bg-zinc-900 amoled:bg-black amoled:border amoled:border-white/10"
          >
            <h2 id="confirm-title" className="text-lg font-semibold text-zinc-900 dark:text-white">
              {title}
            </h2>
            {description && <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>}
            <div className="mt-6 flex gap-3">
              <button
                onClick={onCancel}
                className="min-h-[48px] flex-1 rounded-2xl bg-zinc-100 text-sm font-medium text-zinc-700 transition hover:bg-zinc-200 dark:bg-white/10 dark:text-zinc-200 dark:hover:bg-white/15"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                className={`min-h-[48px] flex-1 rounded-2xl text-sm font-semibold text-white transition ${
                  destructive ? "bg-rose-600 hover:bg-rose-700" : "bg-lavender-600 hover:bg-lavender-700"
                }`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
