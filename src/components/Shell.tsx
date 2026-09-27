import type { ReactNode } from "react";
import { BottomNav } from "./ui/BottomNav";

export function Shell({ children, withNav = true }: { children: ReactNode; withNav?: boolean }) {
  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-black amoled:bg-black md:flex md:items-center md:justify-center md:py-6">
      <div className="relative flex min-h-screen w-full flex-col bg-zinc-50 text-zinc-900 dark:bg-[#121018] dark:text-zinc-100 amoled:bg-black md:min-h-[850px] md:max-w-[420px] md:overflow-hidden md:rounded-[2.5rem] md:border md:border-black/10 md:shadow-2xl dark:md:border-white/10">
        <div className="flex-1 overflow-y-auto no-scrollbar">{children}</div>
        {withNav && <BottomNav />}
      </div>
    </div>
  );
}
