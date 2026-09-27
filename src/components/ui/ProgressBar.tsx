interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
  trackClassName?: string;
  barClassName?: string;
}

export function ProgressBar({ value, className = "", trackClassName = "", barClassName = "" }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`h-2.5 w-full overflow-hidden rounded-full bg-zinc-200/70 dark:bg-white/10 ${trackClassName} ${className}`}
    >
      <div
        className={`h-full rounded-full bg-gradient-to-r from-lavender-500 to-lavender-400 transition-[width] duration-500 ease-out ${barClassName}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export function ProgressRing({ value, size = 64, stroke = 6 }: { value: number; size?: number; stroke?: number }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circumference - (clamped / 100) * circumference;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={stroke}
        className="fill-none stroke-zinc-200/70 dark:stroke-white/10"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="fill-none stroke-lavender-500 transition-[stroke-dashoffset] duration-500 ease-out"
      />
    </svg>
  );
}
