"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  FileCheck2,
  Bookmark,
  MessageSquare,
  Sparkles,
  Award,
  Plus,
  CalendarCheck,
  Search,
  X,
} from "lucide-react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAddReminder: () => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  onOpenAddReminder,
}: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent handles toggle
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const quickNav = [
    { label: "Dashboard", href: "/", icon: Calendar, category: "Navigation" },
    { label: "Class Schedule & Whole Semester", href: "/schedule", icon: Calendar, category: "Navigation" },
    { label: "Important Dates & Reminders", href: "/reminders", icon: Clock, category: "Navigation" },
    { label: "Upcoming Assignments", href: "/assignments", icon: FileCheck2, category: "Navigation" },
    { label: "Important Links Directory", href: "/links", icon: Bookmark, category: "Navigation" },
    { label: "Faculty Feedback (Anonymous)", href: "/feedback", icon: Award, category: "Navigation" },
    { label: "Anonymous Batch Chat (24h Purge)", href: "/chat", icon: MessageSquare, category: "Navigation" },
    { label: "Party & Social Events", href: "/party", icon: Sparkles, category: "Navigation" },
  ];

  const actions = [
    {
      label: "Add New Reminder / Quiz Date",
      action: () => {
        onClose();
        onOpenAddReminder();
      },
      icon: Plus,
      category: "Actions",
    },
    {
      label: "Download / Subscribe to .ICS Calendar Feed",
      action: () => {
        window.open("/api/calendar/feed.ics", "_blank");
        onClose();
      },
      icon: CalendarCheck,
      category: "Actions",
    },
  ];

  const filteredNav = quickNav.filter((i) =>
    i.label.toLowerCase().includes(query.toLowerCase())
  );
  const filteredActions = actions.filter((i) =>
    i.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg rounded-2xl bg-zinc-950 border border-white/10 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Box */}
        <div className="flex items-center px-4 py-3.5 border-b border-white/10 gap-3">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search..."
            className="w-full bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-4">
          {/* Quick Actions */}
          {filteredActions.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[10px] uppercase font-mono tracking-wider text-zinc-500">
                Quick Actions
              </div>
              <div className="space-y-0.5 mt-1">
                {filteredActions.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      onClick={item.action}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-zinc-300 hover:text-white hover:bg-white/10 transition-colors text-left"
                    >
                      <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Navigation */}
          {filteredNav.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[10px] uppercase font-mono tracking-wider text-zinc-500">
                Jump To Page
              </div>
              <div className="space-y-0.5 mt-1">
                {filteredNav.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        router.push(item.href);
                        onClose();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-zinc-300 hover:text-white hover:bg-white/10 transition-colors text-left"
                    >
                      <div className="p-1.5 rounded-md bg-zinc-800 text-zinc-400 border border-white/5">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {filteredNav.length === 0 && filteredActions.length === 0 && (
            <div className="py-8 text-center text-xs text-zinc-500">
              No results found for &quot;{query}&quot;
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-white/10 bg-zinc-900/50 flex items-center justify-between text-[11px] text-zinc-500">
          <span>PGPx Student Portal</span>
          <div className="flex items-center gap-2">
            <span>Navigate: <kbd className="px-1 rounded bg-zinc-800 text-zinc-400">↑↓</kbd></span>
            <span>Close: <kbd className="px-1 rounded bg-zinc-800 text-zinc-400">ESC</kbd></span>
          </div>
        </div>
      </div>
    </div>
  );
}
