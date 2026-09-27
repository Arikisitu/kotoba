interface TagChipProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  removable?: boolean;
  onRemove?: () => void;
}

export function TagChip({ label, active, onClick, removable, onRemove }: TagChipProps) {
  return (
    <span
      onClick={onClick}
      className={`inline-flex select-none items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
        onClick ? "cursor-pointer" : ""
      } ${
        active
          ? "bg-lavender-600 text-white"
          : "bg-lavender-50 text-lavender-700 dark:bg-white/[0.06] dark:text-lavender-200"
      }`}
    >
      #{label}
      {removable && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          aria-label={`Remove tag ${label}`}
          className="ml-0.5 rounded-full text-current/70 hover:text-current"
        >
          ×
        </button>
      )}
    </span>
  );
}
