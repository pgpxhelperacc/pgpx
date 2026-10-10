"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, User, Shield, CalendarCheck, Check } from "lucide-react";
import { UserProfile } from "@/types";

interface HeaderProps {
  currentUser: UserProfile;
  onOpenCommandPalette: () => void;
  onOpenAddReminder: () => void;
}

export function Header({
  currentUser,
  onOpenCommandPalette,
  onOpenAddReminder,
}: HeaderProps) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const personas = [
    { id: "u-batch", name: "Batch Member", role: "student", roll: "STUDENT" },
    { id: "u-cr", name: "Class Representative", role: "cr", roll: "CR" },
    { id: "u-admin", name: "PGPx Academic Office", role: "admin", roll: "ADMIN" },
  ];

  const switchUser = async (userId: string) => {
    await fetch("/api/auth/me", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    setDropdownOpen(false);
    window.location.reload();
  };

  return (
    <header className="h-13 border-b border-[#1c1c1f] bg-black/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Mobile Brand / Search */}
      <div className="flex items-center gap-3">
        <span className="md:hidden font-medium text-xs tracking-tight text-white flex items-center gap-1.5 mr-1">
          <span className="w-1.5 h-1.5 rounded-full bg-white" />
          PGPx
        </span>
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-[#121214] hover:bg-[#18181b] text-[#71717a] hover:text-[#d4d4d8] border border-[#242428] text-xs transition-colors"
          title="Search or execute actions (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5 text-[#71717a]" />
          <span className="hidden sm:inline">Search courses, deadlines, links...</span>
          <span className="sm:hidden">Search...</span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-[#1c1c20] border border-[#2c2c32] text-[10px] font-mono text-[#a1a1aa]">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Calendar Feed Subscription Link */}
        <a
          href="/api/calendar/feed.ics"
          download="pgpx-calendar.ics"
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#121214] hover:bg-[#18181b] border border-[#242428] text-xs text-[#a1a1aa] hover:text-white transition-colors"
          title="Subscribe in Apple / Google Calendar"
        >
          <CalendarCheck className="w-3.5 h-3.5 text-[#71717a]" />
          <span>Sync .ICS</span>
        </a>

        {/* Quick Add Reminder */}
        <button
          onClick={onOpenAddReminder}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-white hover:bg-[#eaeaea] text-black font-medium text-xs transition-colors active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Date</span>
        </button>

        {/* User Persona Switcher */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-2 py-1 rounded bg-[#121214] hover:bg-[#18181b] border border-[#242428] text-xs transition-colors"
          >
            <div className="w-5 h-5 rounded bg-[#27272a] border border-[#3f3f46] flex items-center justify-center text-[10px] font-semibold text-white">
              {currentUser.name.charAt(0)}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-[11px] font-medium text-white truncate max-w-[100px]">
                {currentUser.name}
              </span>
              <span className="text-[9px] font-mono text-[#71717a] flex items-center gap-1">
                {currentUser.role === "cr" && <Shield className="w-2 h-2 text-[#a1a1aa]" />}
                {currentUser.role.toUpperCase()}
              </span>
            </div>
          </button>

          {/* Persona Menu Dropdown */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-60 rounded-lg bg-[#0c0c0e] border border-[#242428] shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2 border-b border-zinc-800 mb-1">
                <p className="text-[11px] font-semibold text-white">{currentUser.name}</p>
                <p className="text-[10px] font-mono text-zinc-400">{currentUser.email}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 text-[10px] font-mono">
                    {currentUser.roll_no}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px] font-mono">
                    {currentUser.batch}{currentUser.term ? ` • ${currentUser.term}` : ""}
                  </span>
                </div>
              </div>

              <div className="px-3 py-1.5 text-[10px] uppercase font-mono tracking-wider text-zinc-400">
                Switch Test Role:
              </div>

              {personas.map((p) => {
                const isSelected = p.id === currentUser.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => switchUser(p.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors text-left ${
                      isSelected
                        ? "bg-white/10 text-white font-medium"
                        : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                    }`}
                  >
                    <div>
                      <div className="text-white text-xs">{p.name}</div>
                      <div className="text-[10px] font-mono text-zinc-400">
                        {p.role.toUpperCase()} ({p.roll})
                      </div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                  </button>
                );
              })}

              <div className="mt-2 pt-2 border-t border-white/10 text-[10px] text-zinc-400 px-3">
                Institute email login enforced.
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
