"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  Clock,
  FileCheck2,
  Bookmark,
  Sparkles,
  ExternalLink,
  Search,
  ArrowUpRight,
  Layers,
  MessageSquare,
  Send,
  RefreshCw,
  Info,
  Calendar,
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
  ChatMessage,
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
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [links, setLinks] = useState<ImportantLink[]>([]);
  const [partyEvents, setPartyEvents] = useState<PartyEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Chat State (Hero feature)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [myPseudonym, setMyPseudonym] = useState("Silent Member");
  const [chatInput, setChatInput] = useState("");
  const [sendingChat, setSendingChat] = useState(false);
  const [rerolling, setRerolling] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Modals
  const [openReminderModal, setOpenReminderModal] = useState(false);
  const [openAssignmentModal, setOpenAssignmentModal] = useState(false);
  const [openLinkModal, setOpenLinkModal] = useState(false);
  const [openPartyModal, setOpenPartyModal] = useState(false);

  // Filter & Search
  const [activeTab, setActiveTab] = useState<"all" | "reminders" | "assignments" | "links">("all");
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

  const loadChat = async () => {
    try {
      const res = await fetch("/api/chat");
      const data = await res.json();
      if (data.messages) setChatMessages(data.messages);
      if (data.currentUserPseudonym) setMyPseudonym(data.currentUserPseudonym);
    } catch (err) {
      console.error("Failed to load chat", err);
    }
  };

  const handleReroll = async () => {
    setRerolling(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reroll: true }),
      });
      const data = await res.json();
      if (data.currentUserPseudonym) {
        setMyPseudonym(data.currentUserPseudonym);
      }
    } catch (err) {
      console.error("Failed to re-roll pseudonym", err);
    } finally {
      setRerolling(false);
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || sendingChat) return;

    const text = chatInput.trim();
    setSendingChat(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      if (res.ok) {
        setChatInput("");
        await loadChat();
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    } catch (err) {
      console.error("Failed to send chat", err);
    } finally {
      setSendingChat(false);
    }
  };

  useEffect(() => {
    loadData();
    loadChat();

    const interval = setInterval(loadChat, 3000);
    return () => clearInterval(interval);
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
      rawDate: p.starts_at,
    })),
  ];

  const filteredItems = unifiedItems.filter((item) => {
    if (activeTab === "reminders" && item.type !== "reminder") return false;
    if (activeTab === "assignments" && item.type !== "assignment") return false;
    if (activeTab === "links" && item.type !== "link") return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.subtitle?.toLowerCase().includes(q) ||
        item.badge?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-5 max-w-7xl mx-auto animate-in fade-in duration-150">
      {/* Top Banner: Batch-Wide Collaboration Identity */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#0e0e12] via-[#09090b] to-[#0e0e12] border border-white/[0.08] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono tracking-wider uppercase text-zinc-400">
              PGPx Batch Portal
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-[11px] font-mono text-zinc-500">IIM Rohtak</span>
          </div>
          <h1 className="text-lg sm:text-xl font-semibold text-white tracking-tight">
            Collaborative Batch Hub
          </h1>
          <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
            A shared portal for the entire batch. Everyone helps everyone — post updates, contribute deadlines, share course drives, and connect anonymously.
          </p>
        </div>

        {/* Global Schedule Notice Pill */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-xs">
          <Link
            href="/schedule"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-white/[0.08] text-zinc-300 hover:text-white transition-colors"
          >
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            <span>Class Timetable:</span>
            <span className="text-zinc-500 font-mono text-[11px]">To be updated soon</span>
          </Link>
        </div>
      </div>

      {/* MAIN TWO-COLUMN SPLIT: ANONYMOUS CHAT IS THE MAJOR SPACE (Col-span-7/8) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ============================================================ */}
        {/* MAJOR SPACE (Left 7 Columns): ANONYMOUS BATCH CHAT */}
        {/* ============================================================ */}
        <div className="lg:col-span-7 flex flex-col rounded-2xl bg-[#09090b] border border-white/[0.08] shadow-2xl h-[680px] overflow-hidden">
          {/* Chat Header */}
          <div className="p-3.5 sm:p-4 border-b border-white/[0.06] bg-[#0c0c0e] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white flex items-center gap-2">
                  <span>Anonymous Batch Lounge</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 border border-white/10">
                    24h Purge
                  </span>
                </div>
                <div className="text-[11px] text-zinc-500">
                  Ephemeral, text-only lounge. Zero logs stored permanently.
                </div>
              </div>
            </div>

            {/* Dynamic Pseudonym Pill with Re-roll */}
            <div className="flex items-center gap-2 bg-zinc-950/80 border border-white/[0.08] px-3 py-1.5 rounded-xl self-start sm:self-auto shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <div className="text-[11px] font-mono flex items-center gap-1.5">
                <span className="text-zinc-500">Posting as:</span>
                <span className="text-white font-semibold truncate max-w-[130px]">
                  {myPseudonym}
                </span>
              </div>
              <button
                onClick={handleReroll}
                disabled={rerolling}
                title="Randomize your handle"
                type="button"
                className="ml-1 p-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${rerolling ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Ephemeral Info Sub-bar */}
          <div className="px-4 py-1.5 bg-[#0e0e11] border-b border-white/[0.04] text-[10px] font-mono text-zinc-500 flex items-center">
            <span className="flex items-center gap-1.5">
              <Info className="w-3 h-3 text-zinc-500" />
              <span>Pseudonyms rotate daily or via re-roll • Keep interactions constructive</span>
            </span>
          </div>

          {/* Chat Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#070709]">
            {chatMessages.length > 0 ? (
              chatMessages.map((msg) => {
                const isOwn = msg.pseudonym === myPseudonym;
                const timeStr = new Date(msg.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isOwn ? "items-end" : "items-start"} space-y-1`}
                  >
                    <div className="flex items-center gap-2 px-1 text-[10px] font-mono text-zinc-500">
                      <span className={isOwn ? "text-zinc-300 font-semibold" : "text-zinc-400"}>
                        {msg.pseudonym}
                      </span>
                      <span>•</span>
                      <span>{timeStr}</span>
                    </div>

                    <div
                      className={`p-3 rounded-2xl text-xs sm:text-[13px] max-w-[85%] leading-relaxed transition-all ${
                        isOwn
                          ? "bg-white text-black font-normal rounded-tr-sm shadow-md"
                          : "bg-[#121215] text-zinc-200 border border-white/[0.06] rounded-tl-sm hover:border-white/[0.12]"
                      }`}
                    >
                      {msg.body}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-zinc-500 space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium text-zinc-300">
                  Welcome to the PGPx Anonymous Lounge
                </p>
                <p className="text-[11px] text-zinc-500 max-w-xs leading-relaxed">
                  No names, no roll numbers. Post anything anonymously to help, ask, or banter with the batch.
                </p>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={handleSendChat}
            className="p-3 border-t border-white/[0.06] bg-[#0c0c0e] flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={`Text anonymously as ${myPseudonym}...`}
              maxLength={1000}
              className="flex-1 bg-[#141418] border border-white/[0.08] px-3.5 py-2 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 transition-colors"
            />
            <button
              type="submit"
              disabled={sendingChat || !chatInput.trim()}
              className="px-4 py-2 rounded-xl bg-white text-black hover:bg-zinc-200 font-medium text-xs flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* ============================================================ */}
        {/* COMPANION SPACE (Right 5 Columns): 4 QUICK BLOCKS + STREAM */}
        {/* ============================================================ */}
        <div className="lg:col-span-5 space-y-4">
          {/* THE 4 ACTION BLOCKS (2x2 Grid) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500">
                Quick Actions
              </span>
              <span className="text-[10px] font-mono text-zinc-600">
                Contributed by Batch
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Block 1: Create New Reminder */}
              <button
                onClick={() => setOpenReminderModal(true)}
                className="group p-3 rounded-xl bg-[#0c0c0e] hover:bg-[#121215] border border-white/[0.08] hover:border-white/20 text-left transition-all flex flex-col justify-between h-24 shadow-sm"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">Add Important Date</div>
                  <div className="text-[10px] text-zinc-400 mt-0.5 line-clamp-1">
                    Quiz, exam or submission
                  </div>
                </div>
              </button>

              {/* Block 2: Create New Assignment */}
              <button
                onClick={() => setOpenAssignmentModal(true)}
                className="group p-3 rounded-xl bg-[#0c0c0e] hover:bg-[#121215] border border-white/[0.08] hover:border-white/20 text-left transition-all flex flex-col justify-between h-24 shadow-sm"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white">
                    <FileCheck2 className="w-3.5 h-3.5" />
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">Add Assignment</div>
                  <div className="text-[10px] text-zinc-400 mt-0.5 line-clamp-1">
                    Deliverable & weightage
                  </div>
                </div>
              </button>

              {/* Block 3: Create New Link */}
              <button
                onClick={() => setOpenLinkModal(true)}
                className="group p-3 rounded-xl bg-[#0c0c0e] hover:bg-[#121215] border border-white/[0.08] hover:border-white/20 text-left transition-all flex flex-col justify-between h-24 shadow-sm"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white">
                    <Bookmark className="w-3.5 h-3.5" />
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">Add Important Link</div>
                  <div className="text-[10px] text-zinc-400 mt-0.5 line-clamp-1">
                    Course drive or portal
                  </div>
                </div>
              </button>

              {/* Block 4: Create New Party / Social */}
              <button
                onClick={() => setOpenPartyModal(true)}
                className="group p-3 rounded-xl bg-[#0c0c0e] hover:bg-[#121215] border border-white/[0.08] hover:border-white/20 text-left transition-all flex flex-col justify-between h-24 shadow-sm"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">Create Party Chat</div>
                  <div className="text-[10px] text-zinc-400 mt-0.5 line-clamp-1">
                    Batch dinner or mixer
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* BATCH CONTRIBUTIONS STREAM */}
          <div className="rounded-2xl bg-[#09090b] border border-white/[0.08] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">Batch Updates Feed</span>
              <span className="text-[10px] font-mono text-zinc-500">
                {unifiedItems.length} published
              </span>
            </div>

            {/* Filter Tabs & Search */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {[
                { id: "all", label: "All" },
                { id: "reminders", label: "Dates" },
                { id: "assignments", label: "Assignments" },
                { id: "links", label: "Links" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-2.5 py-1 rounded-lg text-xs transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-white/10 text-white font-medium"
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Stream List */}
            {loading ? (
              <div className="py-12 text-center text-xs text-zinc-500 font-mono">
                Loading batch updates...
              </div>
            ) : filteredItems.length === 0 ? (
              /* Clean Honest Empty State */
              <div className="py-8 px-4 rounded-xl border border-dashed border-white/[0.08] bg-[#0c0c0e]/50 text-center space-y-2">
                <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-zinc-400">
                  <Layers className="w-3.5 h-3.5" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-white">To be updated by the batch</p>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    Zero dummy data. As classes start, anyone in the batch can add dates, assignments, or links using the 4 blocks above.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {filteredItems.map((item) => (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="p-3 rounded-xl bg-[#0c0c0e] hover:bg-[#121215] border border-white/[0.06] transition-colors space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/5 text-zinc-400 border border-white/10 uppercase">
                        {item.type}
                      </span>
                      {item.dateStr && (
                        <span className="text-[10px] font-mono text-zinc-500">
                          {item.dateStr}
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-medium text-white line-clamp-1">
                      {item.title}
                    </div>
                    {item.subtitle && (
                      <div className="text-[11px] text-zinc-400 line-clamp-1">
                        {item.subtitle}
                      </div>
                    )}
                    {item.url && (
                      <div className="pt-1 flex justify-end">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white transition-colors"
                        >
                          <span>Open link</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

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
