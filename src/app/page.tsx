"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Clock,
  FileCheck2,
  Bookmark,
  Sparkles,
  Plus,
  ExternalLink,
  Search,
  ArrowUpRight,
  Layers,
} from "lucide-react";
import { AddReminderModal } from "@/components/reminders/AddReminderModal";
import { CreateAssignmentModal } from "@/components/modals/CreateAssignmentModal";
import { CreateLinkModal } from "@/components/modals/CreateLinkModal";
import { CreatePartyModal } from "@/components/modals/CreatePartyModal";
import {
  Reminder,
  Assignment,
  ImportantLink,
  PartyEvent,
  UserProfile,
} from "@/types";

type ItemType = "reminder" | "assignment" | "link" | "party";

interface UnifiedItem {
  id: string;
  type: ItemType;
  title: string;
  subtitle?: string;
  dateStr?: string;
  badge?: string;
  category?: string;
  url?: string;
  creatorName?: string;
  rawDate?: string;
  venue?: string;
  budget?: number;
  weightage?: number;
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [links, setLinks] = useState<ImportantLink[]>([]);
  const [partyEvents, setPartyEvents] = useState<PartyEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [openReminderModal, setOpenReminderModal] = useState(false);
  const [openAssignmentModal, setOpenAssignmentModal] = useState(false);
  const [openLinkModal, setOpenLinkModal] = useState(false);
  const [openPartyModal, setOpenPartyModal] = useState(false);

  // Filter & Search
  const [activeTab, setActiveTab] = useState<"all" | "reminders" | "assignments" | "links" | "party">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = async () => {
    try {
      const [uRes, rRes, aRes, lRes, pRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/reminders"),
        fetch("/api/assignments"),
        fetch("/api/links"),
        fetch("/api/party"),
      ]);

      const [uData, rData, aData, lData, pData] = await Promise.all([
        uRes.json(),
        rRes.json(),
        aRes.json(),
        lRes.json(),
        pRes.json(),
      ]);

      if (uData.user) setUser(uData.user);
      if (rData.reminders) setReminders(rData.reminders);
      if (aData.assignments) setAssignments(aData.assignments);
      if (lData.links) setLinks(lData.links);
      if (pData.events) setPartyEvents(pData.events);
    } catch (err) {
      console.error("Failed to load portal data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Format Unified List
  const unifiedItems: UnifiedItem[] = [
    ...reminders.map((r) => ({
      id: r.id,
      type: "reminder" as ItemType,
      title: r.title,
      subtitle: r.description || undefined,
      dateStr: new Date(r.due_at).toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      badge: r.category,
      category: r.category,
      url: r.link,
      creatorName: r.creator_name,
      rawDate: r.due_at,
    })),
    ...assignments.map((a) => ({
      id: a.id,
      type: "assignment" as ItemType,
      title: a.title,
      subtitle: `${a.course_code} • ${a.type === "group" ? "Group" : "Individual"}`,
      dateStr: new Date(a.due_at).toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      badge: `${a.weightage}% Weight`,
      category: "Assignment",
      url: a.submission_url,
      weightage: a.weightage,
      rawDate: a.due_at,
    })),
    ...links.map((l) => ({
      id: l.id,
      type: "link" as ItemType,
      title: l.title,
      subtitle: l.category,
      badge: l.category,
      category: l.category,
      url: l.url,
      rawDate: l.created_at,
    })),
    ...partyEvents.map((p) => ({
      id: p.id,
      type: "party" as ItemType,
      title: p.title,
      subtitle: `${p.venue} • ₹${p.budget_per_head || 0}/head`,
      dateStr: new Date(p.starts_at).toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      badge: p.category,
      category: "Social Plan",
      venue: p.venue,
      budget: p.budget_per_head,
      rawDate: p.starts_at,
    })),
  ];

  // Filter items by tab and search
  const filteredItems = unifiedItems.filter((item) => {
    if (activeTab === "reminders" && item.type !== "reminder") return false;
    if (activeTab === "assignments" && item.type !== "assignment") return false;
    if (activeTab === "links" && item.type !== "link") return false;
    if (activeTab === "party" && item.type !== "party") return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchSub = item.subtitle?.toLowerCase().includes(q);
      const matchBadge = item.badge?.toLowerCase().includes(q);
      return matchTitle || matchSub || matchBadge;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-100">
      {/* Top Header Breadcrumb & Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#1c1c1f] gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 text-[11px] font-mono text-[#71717a]">
            <span>iim-rohtak</span>
            <span>/</span>
            <span className="text-[#ededed]">pgpx-portal</span>
            <span>/</span>
            <span>{user?.batch || "PGPx06"}</span>
          </div>
          <h1 className="text-base sm:text-lg font-medium text-white tracking-tight">
            Overview
          </h1>
          <p className="text-xs text-[#71717a]">
            Unified student directory for deadlines, assignments, links, and batch events.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#121214] border border-[#222226] text-[#8e8e93]">
            {unifiedItems.length} records
          </span>
        </div>
      </div>

      {/* Mobile Quick Navigation Strip */}
      <div className="md:hidden flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-[#1c1c1f]">
        {[
          { label: "Schedule", href: "/schedule" },
          { label: "Dates", href: "/reminders" },
          { label: "Assignments", href: "/assignments" },
          { label: "Links", href: "/links" },
          { label: "Feedback", href: "/feedback" },
          { label: "Socials", href: "/party" },
          { label: "Admin", href: "/admin" },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="px-2 py-1 rounded bg-[#121214] border border-[#222226] text-[11px] text-[#a1a1aa] whitespace-nowrap"
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* TOP: FOUR ACTION BLOCKS (Supabase & Vercel Style) */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-mono tracking-wider text-[#636366]">
            Quick Create
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Block 1: Create New Reminder */}
          <button
            onClick={() => setOpenReminderModal(true)}
            className="group p-3 rounded-lg bg-[#0c0c0e] hover:bg-[#121214] border border-[#1e1e22] hover:border-[#323238] text-left transition-colors flex flex-col justify-between h-24"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-6 h-6 rounded bg-[#18181b] border border-[#27272a] flex items-center justify-center text-white">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#52525b] group-hover:text-white transition-colors" />
            </div>
            <div>
              <div className="text-xs font-medium text-white">Create New Reminder</div>
              <div className="text-[11px] text-[#71717a] mt-0.5 line-clamp-1">
                Quiz, exam or submission deadline
              </div>
            </div>
          </button>

          {/* Block 2: Create New Assignment */}
          <button
            onClick={() => setOpenAssignmentModal(true)}
            className="group p-3 rounded-lg bg-[#0c0c0e] hover:bg-[#121214] border border-[#1e1e22] hover:border-[#323238] text-left transition-colors flex flex-col justify-between h-24"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-6 h-6 rounded bg-[#18181b] border border-[#27272a] flex items-center justify-center text-white">
                <FileCheck2 className="w-3.5 h-3.5" />
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#52525b] group-hover:text-white transition-colors" />
            </div>
            <div>
              <div className="text-xs font-medium text-white">Create New Assignment</div>
              <div className="text-[11px] text-[#71717a] mt-0.5 line-clamp-1">
                Deliverable, weightage & portal link
              </div>
            </div>
          </button>

          {/* Block 3: Create New Link */}
          <button
            onClick={() => setOpenLinkModal(true)}
            className="group p-3 rounded-lg bg-[#0c0c0e] hover:bg-[#121214] border border-[#1e1e22] hover:border-[#323238] text-left transition-colors flex flex-col justify-between h-24"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-6 h-6 rounded bg-[#18181b] border border-[#27272a] flex items-center justify-center text-white">
                <Bookmark className="w-3.5 h-3.5" />
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#52525b] group-hover:text-white transition-colors" />
            </div>
            <div>
              <div className="text-xs font-medium text-white">Create New Link</div>
              <div className="text-[11px] text-[#71717a] mt-0.5 line-clamp-1">
                Course drive, portal or resource
              </div>
            </div>
          </button>

          {/* Block 4: Create New Party / Social */}
          <button
            onClick={() => setOpenPartyModal(true)}
            className="group p-3 rounded-lg bg-[#0c0c0e] hover:bg-[#121214] border border-[#1e1e22] hover:border-[#323238] text-left transition-colors flex flex-col justify-between h-24"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-6 h-6 rounded bg-[#18181b] border border-[#27272a] flex items-center justify-center text-white">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#52525b] group-hover:text-white transition-colors" />
            </div>
            <div>
              <div className="text-xs font-medium text-white">Create New Party Chat</div>
              <div className="text-[11px] text-[#71717a] mt-0.5 line-clamp-1">
                Batch dinner, outing or mixer
              </div>
            </div>
          </button>
        </div>
      </section>

      {/* BELOW: SUPABASE-STYLE DATA TABLE / CREATED ITEMS STREAM */}
      <section className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {[
              { id: "all", label: "All", count: unifiedItems.length },
              { id: "reminders", label: "Reminders", count: reminders.length },
              { id: "assignments", label: "Assignments", count: assignments.length },
              { id: "links", label: "Links", count: links.length },
              { id: "party", label: "Social Plans", count: partyEvents.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-2.5 py-1 rounded text-xs transition-colors flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? "bg-[#18181b] text-white font-medium border border-[#27272a]"
                    : "text-[#71717a] hover:text-[#ededed] hover:bg-[#121214]"
                }`}
              >
                <span>{tab.label}</span>
                <span className="text-[10px] font-mono text-[#52525b]">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 text-[#52525b] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search records..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0c0c0e] border border-[#1e1e22] pl-8 pr-2.5 py-1 rounded text-xs text-white placeholder-[#52525b] focus:outline-none focus:border-[#38383f]"
            />
          </div>
        </div>

        {/* Content Table / Stream */}
        {loading ? (
          <div className="p-10 text-center text-xs text-[#52525b] font-mono">
            Loading portal items...
          </div>
        ) : filteredItems.length === 0 ? (
          /* Clean Empty State */
          <div className="p-10 rounded-lg border border-dashed border-[#1e1e22] bg-[#0c0c0e]/50 text-center space-y-3">
            <div className="w-8 h-8 rounded-full bg-[#141416] border border-[#242428] flex items-center justify-center mx-auto text-[#71717a]">
              <Layers className="w-4 h-4" />
            </div>
            <div className="space-y-0.5 max-w-sm mx-auto">
              <h3 className="text-xs font-medium text-white">No items created yet</h3>
              <p className="text-[11px] text-[#71717a] leading-relaxed">
                This portal is completely fresh. Click any of the four blocks above to publish a reminder, assignment, resource link, or batch event.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
              <button
                onClick={() => setOpenReminderModal(true)}
                className="px-2.5 py-1 rounded bg-[#121214] hover:bg-[#18181b] border border-[#222226] text-xs text-[#a1a1aa] hover:text-white transition-colors"
              >
                + New Reminder
              </button>
              <button
                onClick={() => setOpenAssignmentModal(true)}
                className="px-2.5 py-1 rounded bg-[#121214] hover:bg-[#18181b] border border-[#222226] text-xs text-[#a1a1aa] hover:text-white transition-colors"
              >
                + New Assignment
              </button>
              <button
                onClick={() => setOpenLinkModal(true)}
                className="px-2.5 py-1 rounded bg-[#121214] hover:bg-[#18181b] border border-[#222226] text-xs text-[#a1a1aa] hover:text-white transition-colors"
              >
                + New Link
              </button>
              <button
                onClick={() => setOpenPartyModal(true)}
                className="px-2.5 py-1 rounded bg-[#121214] hover:bg-[#18181b] border border-[#222226] text-xs text-[#a1a1aa] hover:text-white transition-colors"
              >
                + New Party
              </button>
            </div>
          </div>
        ) : (
          /* Sleek Table Container */
          <div className="border border-[#1e1e22] rounded-lg bg-[#0c0c0e] divide-y divide-[#18181b] overflow-hidden">
            <div className="px-3.5 py-1.5 bg-[#09090b] text-[10px] font-mono uppercase tracking-wider text-[#52525b] flex items-center justify-between">
              <span>Title & Details</span>
              <span className="hidden sm:inline">Timeline / Action</span>
            </div>

            {filteredItems.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                className="px-3.5 py-2.5 hover:bg-[#111114] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-[#161619] text-[#71717a] border border-[#242428] uppercase">
                      {item.type}
                    </span>
                    {item.badge && (
                      <span className="text-[10px] font-mono text-[#71717a]">
                        {item.badge}
                      </span>
                    )}
                    {item.dateStr && (
                      <span className="text-[10px] font-mono text-[#52525b]">
                        • {item.dateStr}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xs font-medium text-white truncate">
                    {item.title}
                  </h3>
                  {item.subtitle && (
                    <p className="text-[11px] text-[#71717a] line-clamp-1">
                      {item.subtitle}
                    </p>
                  )}
                </div>

                {/* Item Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#141416] hover:bg-[#1a1a1e] border border-[#222226] text-[#ededed] text-xs transition-colors"
                    >
                      <span>Open</span>
                      <ExternalLink className="w-3 h-3 text-[#71717a]" />
                    </a>
                  )}

                  {item.type === "reminder" && (
                    <Link
                      href="/reminders"
                      className="px-2 py-0.5 rounded bg-[#141416] hover:bg-[#1a1a1e] border border-[#222226] text-[#ededed] text-xs transition-colors"
                    >
                      Details
                    </Link>
                  )}

                  {item.type === "assignment" && (
                    <Link
                      href="/assignments"
                      className="px-2 py-0.5 rounded bg-[#141416] hover:bg-[#1a1a1e] border border-[#222226] text-[#ededed] text-xs transition-colors"
                    >
                      View Deliverable
                    </Link>
                  )}

                  {item.type === "party" && (
                    <Link
                      href="/party"
                      className="px-2 py-0.5 rounded bg-[#141416] hover:bg-[#1a1a1e] border border-[#222226] text-[#ededed] text-xs transition-colors"
                    >
                      RSVP / Join
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* MODALS */}
      <AddReminderModal
        isOpen={openReminderModal}
        onClose={() => setOpenReminderModal(false)}
        onReminderAdded={loadData}
      />

      <CreateAssignmentModal
        isOpen={openAssignmentModal}
        onClose={() => setOpenAssignmentModal(false)}
        onCreated={loadData}
      />

      <CreateLinkModal
        isOpen={openLinkModal}
        onClose={() => setOpenLinkModal(false)}
        onCreated={loadData}
      />

      <CreatePartyModal
        isOpen={openPartyModal}
        onClose={() => setOpenPartyModal(false)}
        onCreated={loadData}
      />
    </div>
  );
}
