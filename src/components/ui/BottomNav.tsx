import { Home, GraduationCap, Library, BarChart3, Settings } from "lucide-react";
import { NavLink } from "react-router-dom";

const items = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/learn", label: "Learn", icon: GraduationCap, end: false },
  { to: "/library", label: "Library", icon: Library, end: false },
  { to: "/stats", label: "Stats", icon: BarChart3, end: false },
  { to: "/settings", label: "Settings", icon: Settings, end: false },
];

export function BottomNav() {
  return (
    <nav className="sticky bottom-0 z-30 border-t border-black/5 bg-white/90 backdrop-blur-lg dark:border-white/5 dark:bg-zinc-950/90 amoled:bg-black/95">
      <div className="mx-auto flex max-w-md items-stretch justify-between px-1 pb-[env(safe-area-inset-bottom)]">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium transition-colors ${
                isActive ? "text-lavender-600 dark:text-lavender-300" : "text-zinc-400 dark:text-zinc-500"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.4 : 2} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
