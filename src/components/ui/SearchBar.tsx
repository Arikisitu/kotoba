import { Search, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder = "Search..." }: SearchBarProps) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-black/5 bg-white px-4 py-2.5 shadow-sm dark:border-white/10 dark:bg-white/[0.05]">
      <Search className="h-4 w-4 shrink-0 text-zinc-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full bg-transparent text-sm text-zinc-800 outline-none placeholder:text-zinc-400 dark:text-zinc-100"
      />
      {value && (
        <button onClick={() => onChange("")} aria-label="Clear search" className="text-zinc-400 hover:text-zinc-600">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
