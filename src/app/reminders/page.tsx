"use client";

import { useEffect, useState } from "react";
import {
  Clock,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Trash2,
  Edit2,
  History,
  Bell,
  BellOff,
  CalendarCheck,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { CountdownTimer } from "@/components/ui/CountdownTimer";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { AddReminderModal } from "@/components/reminders/AddReminderModal";
import { Reminder, ReminderHistoryEntry, UserProfile } from "@/types";

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [filterCategory, setFilterCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"upcoming" | "past">("upcoming");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Edit history drawer modal
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<ReminderHistoryEntry[]>([]);
  const [historyReminderTitle, setHistoryReminderTitle] = useState("");

  const loadData = async () => {
    try {
      const [remRes, userRes] = await Promise.all([
        fetch("/api/reminders"),
        fetch("/api/auth/me"),
      ]);
      const [remData, userData] = await Promise.all([remRes.json(), userRes.json()]);
      if (remData.reminders) setReminders(remData.reminders);
      if (userData.user) setCurrentUser(userData.user);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const now = Date.now();
  const upcomingReminders = reminders.filter(
    (r) => new Date(r.due_at).getTime() >= now
  );
  const pastReminders = reminders.filter(
    (r) => new Date(r.due_at).getTime() < now
  );

  const displayedList = (viewMode === "upcoming" ? upcomingReminders : pastReminders).filter((r) => {
    const matchCategory = filterCategory === "All" || r.category === filterCategory;
    const matchQuery =
      !searchQuery ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.creator_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchQuery;
  });

  const isCRorAdmin = currentUser?.role === "cr" || currentUser?.role === "admin";

  const handleVerify = async (id: string) => {
    await fetch("/api/reminders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "verify" }),
    });
    loadData();
  };

  const handleToggleSubscription = async (id: string) => {
    await fetch("/api/reminders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "toggle_subscription" }),
    });
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this reminder?")) return;
    await fetch(`/api/reminders?id=${id}`, { method: "DELETE" });
    loadData();
  };

  const handleViewHistory = async (id: string, title: string) => {
    setHistoryReminderTitle(title);
    const res = await fetch(`/api/reminders/history?reminderId=${id}`);
    const data = await res.json();
    setSelectedHistory(data.history || []);
    setHistoryDrawerOpen(true);
  };

  const categories = [
    "All",
    "Assignment",
    "Quiz",
    "Exam",
    "Submission",
    "Event",
    "Holiday",
    "Other",
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Clock className="w-6 h-6 text-blue-400" />
            Important Dates & Reminders
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Crowdsourced and CR-verified quiz dates, exam windows, and submission deadlines.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href="/api/calendar/feed.ics"
            download="pgpx-calendar.ics"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs text-zinc-300 hover:text-white transition-colors"
          >
            <CalendarCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Sync to Calendar</span>
          </a>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-glow transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Date</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-950 p-3 rounded-2xl border border-white/10">
        <div className="flex items-center gap-2 flex-1 max-w-md bg-zinc-900 px-3 py-1.5 rounded-xl border border-white/5">
          <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dates, courses, creators..."
            className="w-full bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-white/5 text-xs">
            <button
              onClick={() => setViewMode("upcoming")}
              className={`px-3 py-1 rounded-lg transition-all ${
                viewMode === "upcoming"
                  ? "bg-white/10 text-white font-medium"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Upcoming ({upcomingReminders.length})
            </button>
            <button
              onClick={() => setViewMode("past")}
              className={`px-3 py-1 rounded-lg transition-all ${
                viewMode === "past"
                  ? "bg-white/10 text-white font-medium"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Past / Overdue ({pastReminders.length})
            </button>
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Reminders List */}
      <div className="space-y-3">
        {displayedList.length > 0 ? (
          displayedList.map((rem) => {
            const isOwner = currentUser?.id === rem.created_by;
            const canEdit = isOwner || isCRorAdmin;

            return (
              <div
                key={rem.id}
                className="p-5 rounded-2xl glass-panel transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge type="category" value={rem.category} />
                    {rem.is_verified ? (
                      <StatusBadge type="verification" value="verified" />
                    ) : (
                      <span className="text-[10px] text-zinc-400 font-mono">
                        Community Added
                      </span>
                    )}
                    <span className="text-zinc-400">•</span>
                    <span className="text-[11px] font-mono text-zinc-400">
                      Added by {rem.creator_name}
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-white group-hover:text-blue-300 transition-colors">
                    {rem.title}
                  </h3>

                  {rem.description && (
                    <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
                      {rem.description}
                    </p>
                  )}

                  {rem.link && (
                    <a
                      href={rem.link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-400 hover:underline pt-0.5"
                    >
                      <span>Submission Portal</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <div className="text-right">
                    <CountdownTimer targetDate={rem.due_at} variant="pill" />
                    <div className="text-[10px] font-mono text-zinc-400 mt-1">
                      {new Date(rem.due_at).toLocaleDateString([], {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="flex items-center gap-1.5 border-l border-white/10 pl-3">
                    {/* Subscription Toggle */}
                    <button
                      onClick={() => handleToggleSubscription(rem.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        rem.user_subscribed
                          ? "bg-blue-600/20 text-blue-400"
                          : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                      }`}
                      title={
                        rem.user_subscribed
                          ? "Alert active (notifying 1d / 1h before)"
                          : "Remind me before deadline"
                      }
                    >
                      {rem.user_subscribed ? (
                        <Bell className="w-4 h-4" />
                      ) : (
                        <BellOff className="w-4 h-4" />
                      )}
                    </button>

                    {/* CR Verification Badge Action */}
                    {!rem.is_verified && isCRorAdmin && (
                      <button
                        onClick={() => handleVerify(rem.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-mono border border-blue-500/20 transition-colors"
                        title="Verify date accuracy"
                      >
                        Verify Date
                      </button>
                    )}

                    {/* View Audit History */}
                    <button
                      onClick={() => handleViewHistory(rem.id, rem.title)}
                      className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                      title="View Edit History"
                    >
                      <History className="w-4 h-4" />
                    </button>

                    {/* Delete if owner or CR/Admin */}
                    {canEdit && (
                      <button
                        onClick={() => handleDelete(rem.id)}
                        className="p-2 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete reminder"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-12 text-center rounded-2xl glass-panel space-y-2">
            <Clock className="w-8 h-8 text-zinc-600 mx-auto" />
            <h4 className="text-sm font-medium text-white">No reminders found</h4>
            <p className="text-xs text-zinc-400">
              No dates match your selected filters. Create one above!
            </p>
          </div>
        )}
      </div>

      {/* Edit History Drawer Modal */}
      <Modal
        isOpen={historyDrawerOpen}
        onClose={() => setHistoryDrawerOpen(false)}
        title="Date Modification Audit Trail"
        description={`Audit history for "${historyReminderTitle}". Prevents silent date tampering.`}
      >
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {selectedHistory.length > 0 ? (
            selectedHistory.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-zinc-900 border border-white/5 space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between text-zinc-400 font-mono text-[11px]">
                  <span>Modified by {item.changed_by_name}</span>
                  <span>{new Date(item.changed_at).toLocaleString()}</span>
                </div>
                <div className="space-y-1">
                  {item.diff.map((d, i) => (
                    <div key={i} className="text-zinc-300">
                      <span className="font-mono text-zinc-400">{d.field}:</span>{" "}
                      <span className="line-through text-rose-400/80 mr-1.5">{d.old_value}</span>
                      <span className="text-emerald-400">{d.new_value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-xs text-zinc-500">
              No modifications recorded yet. Original creation intact.
            </div>
          )}
        </div>
      </Modal>

      {/* Add Reminder Modal */}
      <AddReminderModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onReminderAdded={loadData}
      />
    </div>
  );
}
