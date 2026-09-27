import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

export interface ActionSheetItem {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  destructive?: boolean;
}

interface ActionSheetProps {
  open: boolean;
  title?: string;
  items: ActionSheetItem[];
  onClose: () => void;
}

export function ActionSheet({ open, title, items, onClose }: ActionSheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[95] flex items-end justify-center bg-black/50 backdrop-blur-sm md:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-t-3xl bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl dark:bg-zinc-900 md:rounded-3xl"
          >
            {title && <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">{title}</p>}
            <div className="flex flex-col gap-1">
              {items.map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    item.onClick();
                    onClose();
                  }}
                  className={`flex min-h-[52px] items-center gap-3 rounded-2xl px-3 text-left text-sm font-medium transition hover:bg-zinc-100 dark:hover:bg-white/10 ${
                    item.destructive ? "text-rose-600 dark:text-rose-400" : "text-zinc-700 dark:text-zinc-200"
                  }`}
                >
                  <item.icon className="h-4.5 w-4.5" />
                  {item.label}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
