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
  MapPin,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  Award,
  MessageSquare,
} from "lucide-react";
import { AddReminderModal } from "@/components/reminders/AddReminderModal";
import { CreateAssignmentModal } from "@/components/modals/CreateAssignmentModal";
import { CreateLinkModal } from "@/components/modals/CreateLinkModal";
import { CreatePartyModal } from "@/components/modals/CreatePartyModal";
import { StatusBadge } from "@/components/ui/StatusBadge";
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
      subtitle: `${a.course_code} • ${a.type === "group" ? "Group Submission" : "Individual Submission"}`,
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
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* Top Banner / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-800 gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 mb-1">
            <span>PORTAL</span>
            <span>/</span>
            <span className="text-white">DASHBOARD</span>
            <span>/</span>
            <span>{user?.batch || "PGPx06"}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            PGPx Student Portal
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Minimalist workspace • Create reminders, assignments, links & batch events.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300">
            {unifiedItems.length} Total Items
          </div>
        </div>
      </div>

      {/* Mobile Portals Quick Bar (Shown on small screens where sidebar is hidden) */}
      <div className="md:hidden flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-zinc-900">
        <Link
          href="/schedule"
          className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 whitespace-nowrap"
        >
          Schedule
        </Link>
        <Link
          href="/reminders"
          className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 whitespace-nowrap"
        >
          Dates
        </Link>
        <Link
          href="/assignments"
          className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 whitespace-nowrap"
        >
          Assignments
        </Link>
        <Link
          href="/links"
          className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 whitespace-nowrap"
        >
          Links
        </Link>
        <Link
          href="/feedback"
          className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 whitespace-nowrap"
        >
          Feedback
        </Link>
        <Link
          href="/party"
          className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 whitespace-nowrap"
        >
          Socials
        </Link>
        <Link
          href="/admin"
          className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 whitespace-nowrap"
        >
          Admin
        </Link>
      </div>

      {/* TOP: FOUR ACTION BLOCKS (Vercel Style) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs uppercase font-mono tracking-wider text-zinc-400">
            Quick Actions
          </h2>
          <span className="text-[11px] text-zinc-600 font-mono">Click to create</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Block 1: Create New Reminder */}
          <button
            onClick={() => setOpenReminderModal(true)}
            className="group p-4 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-600 text-left transition-all active:scale-[0.99] flex flex-col justify-between h-32 hover:bg-zinc-900/60"
          >
            <div className="flex items-start justify-between w-full">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white group-hover:bg-white group-hover:text-black transition-colors">
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-zinc-600 group-hover:text-white transition-colors">
                <Plus className="w-4 h-4" />
              </span>
            </div>
            <div>
              <div className="font-semibold text-xs text-white">Create New Reminder</div>
              <div className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1">
                Add quiz, exam or task deadline
              </div>
            </div>
          </button>

          {/* Block 2: Create New Assignment */}
          <button
            onClick={() => setOpenAssignmentModal(true)}
            className="group p-4 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-600 text-left transition-all active:scale-[0.99] flex flex-col justify-between h-32 hover:bg-zinc-900/60"
          >
            <div className="flex items-start justify-between w-full">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white group-hover:bg-white group-hover:text-black transition-colors">
                <FileCheck2 className="w-4 h-4" />
              </div>
              <span className="text-zinc-600 group-hover:text-white transition-colors">
                <Plus className="w-4 h-4" />
              </span>
            </div>
            <div>
              <div className="font-semibold text-xs text-white">Create New Assignment</div>
              <div className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1">
                Deliverable, weightage & portal link
              </div>
            </div>
          </button>

          {/* Block 3: Create New Link */}
          <button
            onClick={() => setOpenLinkModal(true)}
            className="group p-4 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-600 text-left transition-all active:scale-[0.99] flex flex-col justify-between h-32 hover:bg-zinc-900/60"
          >
            <div className="flex items-start justify-between w-full">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white group-hover:bg-white group-hover:text-black transition-colors">
                <Bookmark className="w-4 h-4" />
              </div>
              <span className="text-zinc-600 group-hover:text-white transition-colors">
                <Plus className="w-4 h-4" />
              </span>
            </div>
            <div>
              <div className="font-semibold text-xs text-white">Create New Link</div>
              <div className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1">
                Share portal, drive sheet or resource
              </div>
            </div>
          </button>

          {/* Block 4: Create New Party / Social */}
          <button
            onClick={() => setOpenPartyModal(true)}
            className="group p-4 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-600 text-left transition-all active:scale-[0.99] flex flex-col justify-between h-32 hover:bg-zinc-900/60"
          >
            <div className="flex items-start justify-between w-full">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white group-hover:bg-white group-hover:text-black transition-colors">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-zinc-600 group-hover:text-white transition-colors">
                <Plus className="w-4 h-4" />
              </span>
            </div>
            <div>
              <div className="font-semibold text-xs text-white">Create New Party Chat</div>
              <div className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1">
                Plan batch dinner, trip or mixer
              </div>
            </div>
          </button>
        </div>
      </section>

      {/* BELOW: LIST OF ITEMS CREATED BY EACH BLOCK */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === "all"
                  ? "bg-white text-black"
                  : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
              }`}
            >
              All ({unifiedItems.length})
            </button>
            <button
              onClick={() => setActiveTab("reminders")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === "reminders"
                  ? "bg-white text-black"
                  : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
              }`}
            >
              Reminders ({reminders.length})
            </button>
            <button
              onClick={() => setActiveTab("assignments")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === "assignments"
                  ? "bg-white text-black"
                  : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
              }`}
            >
              Assignments ({assignments.length})
            </button>
            <button
              onClick={() => setActiveTab("links")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === "links"
                  ? "bg-white text-black"
                  : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
              }`}
            >
              Links ({links.length})
            </button>
            <button
              onClick={() => setActiveTab("party")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === "party"
                  ? "bg-white text-black"
                  : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
              }`}
            >
              Socials ({partyEvents.length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search created items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 pl-9 pr-3 py-1.5 rounded-md text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
            />
          </div>
        </div>

        {/* Content Stream */}
        {loading ? (
          <div className="p-12 text-center text-xs text-zinc-500 font-mono">
            Loading portal items...
          </div>
        ) : filteredItems.length === 0 ? (
          /* Clean Empty State */
          <div className="p-12 rounded-xl border border-dashed border-zinc-800 bg-zinc-950/50 text-center space-y-4">
            <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
              <Layers className="w-5 h-5" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="text-sm font-semibold text-white">No items created yet</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                This portal is completely fresh. Use the 4 action blocks above to publish your first reminder, assignment deliverable, link, or batch party.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setOpenReminderModal(true)}
                className="px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 hover:text-white transition-colors"
              >
                + New Reminder
              </button>
              <button
                onClick={() => setOpenAssignmentModal(true)}
                className="px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 hover:text-white transition-colors"
              >
                + New Assignment
              </button>
              <button
                onClick={() => setOpenLinkModal(true)}
                className="px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 hover:text-white transition-colors"
              >
                + New Link
              </button>
              <button
                onClick={() => setOpenPartyModal(true)}
                className="px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 hover:text-white transition-colors"
              >
                + New Party
              </button>
            </div>
          </div>
        ) : (
          /* List of Items */
          <div className="space-y-2">
            {filteredItems.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 uppercase">
                      {item.type}
                    </span>
                    {item.badge && (
                      <span className="text-[10px] font-mono text-zinc-400">
                        {item.badge}
                      </span>
                    )}
                    {item.dateStr && (
                      <span className="text-[11px] font-mono text-zinc-500">
                        • {item.dateStr}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xs font-semibold text-white truncate">
                    {item.title}
                  </h3>
                  {item.subtitle && (
                    <p className="text-[11px] text-zinc-400 line-clamp-1">
                      {item.subtitle}
                    </p>
                  )}
                </div>

                {/* Item Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs transition-colors"
                    >
                      <span>Open</span>
                      <ExternalLink className="w-3 h-3 text-zinc-500" />
                    </a>
                  )}

                  {item.type === "reminder" && (
                    <Link
                      href="/reminders"
                      className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs transition-colors"
                    >
                      Details
                    </Link>
                  )}

                  {item.type === "assignment" && (
                    <Link
                      href="/assignments"
                      className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs transition-colors"
                    >
                      View Deliverable
                    </Link>
                  )}

                  {item.type === "party" && (
                    <Link
                      href="/party"
                      className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs transition-colors"
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
