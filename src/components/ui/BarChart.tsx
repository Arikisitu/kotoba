interface BarChartProps {
  labels: string[];
  values: number[];
  formatLabel?: (label: string, index: number) => string;
}

export function BarChart({ labels, values, formatLabel }: BarChartProps) {
  const max = Math.max(1, ...values);
  return (
    <div className="flex h-32 items-end gap-1.5">
      {values.map((v, i) => (
        <div key={i} className="group flex flex-1 flex-col items-center gap-1.5">
          <div className="relative flex h-24 w-full items-end overflow-hidden rounded-md bg-zinc-100 dark:bg-white/5">
            <div
              className="w-full rounded-md bg-gradient-to-t from-lavender-600 to-lavender-400 transition-all"
              style={{ height: `${(v / max) * 100}%`, minHeight: v > 0 ? 4 : 0 }}
              title={`${v}`}
            />
          </div>
          <span className="text-[9px] font-medium text-zinc-400">{formatLabel ? formatLabel(labels[i], i) : labels[i]}</span>
        </div>
      ))}
    </div>
  );
}
