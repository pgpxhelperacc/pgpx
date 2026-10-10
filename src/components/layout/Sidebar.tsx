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
} from "lucide-react";

interface SidebarProps {
  userRole?: string;
}

export function Sidebar({ userRole = "student" }: SidebarProps) {
  const pathname = usePathname();

  const sections = [
    {
      title: "Workspace",
      items: [
        { label: "Dashboard", href: "/", icon: LayoutDashboard },
      ],
    },
    {
      title: "Academics",
      items: [
        { label: "Class Schedule", href: "/schedule", icon: Calendar },
        { label: "Important Dates", href: "/reminders", icon: Clock },
        { label: "Assignments", href: "/assignments", icon: FileCheck2 },
        { label: "Important Links", href: "/links", icon: Bookmark },
      ],
    },
    {
      title: "Community",
      items: [
        { label: "Faculty Feedback", href: "/feedback", icon: Award },
        { label: "Anonymous Chat", href: "/chat", icon: MessageSquare, badge: "24h" },
        { label: "Party & Socials", href: "/party", icon: Sparkles },
      ],
    },
    ...(userRole === "cr" || userRole === "admin"
      ? [
          {
            title: "Management",
            items: [
              { label: "CR & Admin Hub", href: "/admin", icon: ShieldCheck, badge: userRole.toUpperCase() },
            ],
          },
        ]
      : []),
  ];

  return (
    <aside className="hidden md:flex flex-col w-60 border-r border-[#1c1c1f] bg-black shrink-0 select-none z-30">
      {/* Brand Header */}
      <div className="h-13 flex items-center px-4 border-b border-[#1c1c1f] justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-5 h-5 rounded bg-white text-black flex items-center justify-center font-bold text-[10px] tracking-tight">
            ▲
          </div>
          <span className="font-medium text-xs tracking-tight text-white group-hover:text-zinc-200 transition-colors">
            PGPx Portal
          </span>
        </Link>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#141416] text-[#8e8e93] border border-[#242428]">
          IIMR
        </span>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 py-3 px-2 space-y-4 overflow-y-auto">
        {sections.map((sec) => (
          <div key={sec.title} className="space-y-0.5">
            <div className="px-2.5 pb-1 text-[10px] uppercase font-mono tracking-wider text-[#636366]">
              {sec.title}
            </div>
            {sec.items.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors group ${
                    isActive
                      ? "bg-[#18181b] text-white font-medium border border-[#27272a]"
                      : "text-[#8e8e93] hover:text-[#f4f4f5] hover:bg-[#121214]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-3.5 h-3.5 transition-colors ${
                        isActive ? "text-white" : "text-[#71717a] group-hover:text-[#a1a1aa]"
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#141416] text-[#71717a] border border-[#242428]">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer Info */}
      <div className="p-3 border-t border-[#1c1c1f] text-xs text-[#71717a] flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[11px] text-[#8e8e93]">
          <span className="w-1.5 h-1.5 rounded-full bg-white" />
          PGPx Batch Portal
        </span>
        <span className="font-mono text-[10px] text-[#52525b]">v1.0</span>
      </div>
    </aside>
  );
}
