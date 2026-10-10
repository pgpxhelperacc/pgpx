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
    <aside className="hidden md:flex flex-col w-64 border-r border-zinc-800 bg-black shrink-0 select-none z-30">
      {/* Brand Header */}
      <div className="h-14 flex items-center px-5 border-b border-zinc-800 gap-3">
        <div className="w-7 h-7 rounded-md bg-white text-black flex items-center justify-center font-bold text-xs">
          ▲
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-xs tracking-tight text-white flex items-center gap-1.5">
            PGPx Portal
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
              IIMR
            </span>
          </span>
          <span className="text-[10px] text-zinc-500 font-mono">pgpx.iimrohtak.in</span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 py-3 px-2.5 space-y-0.5 overflow-y-auto">
        <div className="px-3 py-1.5 text-[10px] uppercase font-mono tracking-wider text-zinc-500">
          Portals & Features
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all group ${
                isActive
                  ? "bg-zinc-900 text-white border border-zinc-700"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900/50"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`w-3.5 h-3.5 transition-colors ${
                    isActive ? "text-white" : "text-zinc-400 group-hover:text-zinc-200"
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-3.5 border-t border-zinc-800 text-xs text-zinc-500 space-y-2">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            Portal Active
          </span>
          <span className="font-mono text-[10px] text-zinc-500">v1.0</span>
        </div>
        <p className="text-[10px] text-zinc-500 leading-relaxed font-mono">
          Press <kbd className="px-1 py-0.2 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 text-[10px]">Ctrl+K</kbd> for command palette
        </p>
      </div>
    </aside>
  );
}
