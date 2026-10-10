"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Clock,
  FileCheck2,
  Bookmark,
  MessageSquare,
  Sparkles,
  Award,
  ShieldCheck,
  Zap,
} from "lucide-react";

interface SidebarProps {
  userRole?: string;
}

export function Sidebar({ userRole = "student" }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Class Schedule", href: "/schedule", icon: Calendar },
    { label: "Important Dates", href: "/reminders", icon: Clock },
    { label: "Assignments", href: "/assignments", icon: FileCheck2 },
    { label: "Important Links", href: "/links", icon: Bookmark },
    { label: "Faculty Feedback", href: "/feedback", icon: Award },
    { label: "Anonymous Chat", href: "/chat", icon: MessageSquare, badge: "24h Purge" },
    { label: "Party & Socials", href: "/party", icon: Sparkles, badge: "Batch Only" },
    ...(userRole === "cr" || userRole === "admin"
      ? [{ label: "CR & Admin Hub", href: "/admin", icon: ShieldCheck, badge: userRole.toUpperCase() }]
      : []),
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-white/10 bg-[#09090b]/80 backdrop-blur-xl shrink-0 select-none z-30">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-white/10 gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-glow">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-sm tracking-tight text-white flex items-center gap-1.5">
            PGPx Portal
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              IIMR
            </span>
          </span>
          <span className="text-[11px] text-zinc-400 font-mono">pgpx.iimrohtak.in</span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] uppercase font-mono tracking-wider text-zinc-500">
          Main Navigation
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                isActive
                  ? "bg-white/10 text-white shadow-sm border border-white/10"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? "text-blue-400" : "text-zinc-400 group-hover:text-zinc-200"
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-white/5">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-white/10 text-xs text-zinc-500 space-y-2">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Portal Live
          </span>
          <span className="font-mono text-[10px] text-zinc-500">v1.0 MVP</span>
        </div>
        <p className="text-[11px] text-zinc-400 leading-relaxed">
          Press <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono text-[10px]">Ctrl+K</kbd> for quick command palette.
        </p>
      </div>
    </aside>
  );
}
