"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  AlertCircle,
  CalendarCheck,
  Upload,
  Plus,
  Filter,
  Check,
} from "lucide-react";
import { CountdownTimer } from "@/components/ui/CountdownTimer";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { ScheduleEntry, SemesterCalendarItem, UserProfile } from "@/types";

export default function SchedulePage() {
  const [activeTab, setActiveTab] = useState<"daily" | "weekly" | "semester">("daily");
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [calendar, setCalendar] = useState<SemesterCalendarItem[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [sectionFilter, setSectionFilter] = useState("A");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<ScheduleEntry | null>(null);
  const [changeNote, setChangeNote] = useState("");
  const [newRoom, setNewRoom] = useState("");
  const [loading, setLoading] = useState(true);

  // Form state for adding session
  const [formCourse, setFormCourse] = useState("c-1");
  const [formRoom, setFormRoom] = useState("LT-2");
  const [formDate, setFormDate] = useState("");
  const [formStart, setFormStart] = useState("09:30");
  const [formEnd, setFormEnd] = useState("11:00");
  const [formType, setFormType] = useState<"class" | "quiz" | "guest_lecture" | "make_up">("class");

  const loadData = async () => {
    try {
      const [schRes, calRes, userRes] = await Promise.all([
        fetch("/api/schedule"),
        fetch("/api/calendar"),
        fetch("/api/auth/me"),
      ]);
      const [schData, calData, userData] = await Promise.all([
        schRes.json(),
        calRes.json(),
        userRes.json(),
      ]);
      if (schData.schedule) setSchedule(schData.schedule);
      if (calData.calendar) setCalendar(calData.calendar);
      if (userData.user) setCurrentUser(userData.user);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const isCRorAdmin = currentUser?.role === "cr" || currentUser?.role === "admin";

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntry) return;

    await fetch("/api/schedule", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: selectedEntry.id,
        status: "rescheduled",
        room: newRoom || selectedEntry.room,
        changed_note: changeNote || "Rescheduled by Class Representative",
      }),
    });

    setIsRescheduleModalOpen(false);
    setSelectedEntry(null);
    setChangeNote("");
    setNewRoom("");
    loadData();
  };

  const handleAddSessionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const courseMap: Record<string, { code: string; name: string; fac: string }> = {
      "c-1": { code: "STRAT-601", name: "Strategic Management", fac: "Prof. K. Mukherjee" },
      "c-2": { code: "FIN-602", name: "Corporate Valuation & M&A", fac: "Prof. R. Sharma" },
      "c-3": { code: "OPS-603", name: "Supply Chain Analytics", fac: "Prof. A. Verma" },
      "c-4": { code: "MKT-604", name: "Digital Marketing & Growth", fac: "Prof. P. Gupta" },
    };

    const sel = courseMap[formCourse] || courseMap["c-1"];
    const startsAt = new Date(`${formDate || new Date().toISOString().slice(0, 10)}T${formStart}:00`).toISOString();
    const endsAt = new Date(`${formDate || new Date().toISOString().slice(0, 10)}T${formEnd}:00`).toISOString();

    await fetch("/api/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        course_id: formCourse,
        course_code: sel.code,
        course_name: sel.name,
        faculty_name: sel.fac,
        room: formRoom,
        starts_at: startsAt,
        ends_at: endsAt,
        type: formType,
        status: "scheduled",
        section: sectionFilter,
      }),
    });

    setIsAddModalOpen(false);
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Schedule Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-400" />
            Class Schedule & Academic Calendar
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Real-time daily lectures, room changes, and whole-semester academic milestones.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href="/api/calendar/feed.ics"
            download="pgpx-calendar.ics"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs text-zinc-300 hover:text-white transition-colors"
          >
            <CalendarCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Export .ICS</span>
          </a>

          {isCRorAdmin && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-glow transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Session</span>
            </button>
          )}
        </div>
      </div>

      {/* View Switcher Tabs & Section Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveTab("daily")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "daily"
                ? "bg-white/10 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Today&apos;s Lectures
          </button>
          <button
            onClick={() => setActiveTab("weekly")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "weekly"
                ? "bg-white/10 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Weekly Schedule
          </button>
          <button
            onClick={() => setActiveTab("semester")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "semester"
                ? "bg-white/10 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Whole-Semester Agenda
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-zinc-400">Section:</span>
          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-white/10 text-white text-xs focus:outline-none"
          >
            <option value="A">Section A (Regular)</option>
            <option value="B">Section B (Electives)</option>
          </select>
        </div>
      </div>

      {/* Content for Daily / Weekly */}
      {(activeTab === "daily" || activeTab === "weekly") && (
        <div className="space-y-3">
          {schedule.map((entry) => {
            const isRescheduled = entry.status === "rescheduled";
            return (
              <div
                key={entry.id}
                className={`p-4 sm:p-5 rounded-2xl glass-panel transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isRescheduled ? "border-amber-500/30 bg-amber-950/10" : ""
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-300">
                      {entry.course_code}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {entry.type}
                    </span>
                    <StatusBadge type="schedule" value={entry.status} />
                    {entry.changed_note && (
                      <span className="text-[11px] font-medium text-amber-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-amber-400" />
                        {entry.changed_note}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-semibold text-white">
                    {entry.course_name}
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400">
                    <span className="flex items-center gap-1.5 text-zinc-300">
                      <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                      {entry.room}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-zinc-400" />
                      {entry.faculty_name || "Faculty TBA"}
                    </span>
                    <span>•</span>
                    <span className="font-mono text-zinc-300">
                      {new Date(entry.starts_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      {" - "}
                      {new Date(entry.ends_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <CountdownTimer
                    targetDate={entry.starts_at}
                    label="Starts in"
                    variant="compact"
                  />

                  {isCRorAdmin && (
                    <button
                      onClick={() => {
                        setSelectedEntry(entry);
                        setNewRoom(entry.room);
                        setIsRescheduleModalOpen(true);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 hover:text-white transition-colors"
                    >
                      Reschedule
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Content for Whole-Semester Calendar */}
      {activeTab === "semester" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-500/20 text-xs text-blue-300">
            Term 4 Semester Roadmap: Academic commencement, holidays, mid-term/end-term windows, and industry project week.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {calendar.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl glass-panel space-y-2 border-l-4 border-l-blue-500"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 uppercase">
                    {item.kind.replace("_", " ")}
                  </span>
                  <span className="text-xs font-mono text-zinc-400">
                    {new Date(item.start_date).toLocaleDateString([], { month: "short", day: "numeric" })}
                    {item.start_date !== item.end_date && (
                      <> - {new Date(item.end_date).toLocaleDateString([], { month: "short", day: "numeric" })}</>
                    )}
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-white">{item.label}</h3>

                {item.notes && (
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {item.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      <Modal
        isOpen={isRescheduleModalOpen}
        onClose={() => setIsRescheduleModalOpen(false)}
        title="Reschedule Class Session"
        description="Notify affected batch members immediately of room changes, timing shifts or cancellations."
      >
        <form onSubmit={handleRescheduleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Updated Room / Venue
            </label>
            <input
              type="text"
              value={newRoom}
              onChange={(e) => setNewRoom(e.target.value)}
              placeholder="e.g. LT-1 (Auditorium Wing)"
              className="w-full px-3.5 py-2 rounded-lg bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Reason / Change Note (Visible to batch) *
            </label>
            <input
              type="text"
              required
              value={changeNote}
              onChange={(e) => setChangeNote(e.target.value)}
              placeholder="e.g. Shifted by Prof to accommodate online guest speaker"
              className="w-full px-3.5 py-2 rounded-lg bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => setIsRescheduleModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs transition-colors"
            >
              Save & Notify Batch
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Session Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Class or Quiz Session"
        description="Schedule a make-up lecture, guest session, or quiz slot for the batch."
      >
        <form onSubmit={handleAddSessionSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Course *
            </label>
            <select
              value={formCourse}
              onChange={(e) => setFormCourse(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="c-1">STRAT-601: Strategic Management</option>
              <option value="c-2">FIN-602: Corporate Valuation</option>
              <option value="c-3">OPS-603: Supply Chain Analytics</option>
              <option value="c-4">MKT-604: Digital Marketing</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Room *
              </label>
              <input
                type="text"
                required
                value={formRoom}
                onChange={(e) => setFormRoom(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Session Type *
              </label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="class">Regular Class</option>
                <option value="quiz">Quiz / Exam Slot</option>
                <option value="guest_lecture">Guest Lecture</option>
                <option value="make_up">Make-Up Session</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Date
              </label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Start Time
              </label>
              <input
                type="time"
                value={formStart}
                onChange={(e) => setFormStart(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                End Time
              </label>
              <input
                type="time"
                value={formEnd}
                onChange={(e) => setFormEnd(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors shadow-glow"
            >
              Add Session
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
