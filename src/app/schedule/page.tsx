"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Plus,
  CalendarCheck,
  AlertCircle,
  Filter,
} from "lucide-react";
import { ScheduleEntry, SemesterCalendarItem } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CountdownTimer } from "@/components/ui/CountdownTimer";

export default function SchedulePage() {
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [calendar, setCalendar] = useState<SemesterCalendarItem[]>([]);
  const [activeTab, setActiveTab] = useState<"daily" | "weekly" | "semester">("daily");
  const [sectionFilter, setSectionFilter] = useState("A");
  const [loading, setLoading] = useState(true);

  // CR Modals
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<ScheduleEntry | null>(null);
  const [changeNote, setChangeNote] = useState("");
  const [newRoom, setNewRoom] = useState("");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formCourseName, setFormCourseName] = useState("");
  const [formFacultyName, setFormFacultyName] = useState("");
  const [formRoom, setFormRoom] = useState("Room 204");
  const [formType, setFormType] = useState<any>("class");
  const [formDate, setFormDate] = useState("");
  const [formStart, setFormStart] = useState("09:00");
  const [formEnd, setFormEnd] = useState("10:30");

  const [isCRorAdmin, setIsCRorAdmin] = useState(false);

  const loadData = async () => {
    try {
      const [schRes, calRes, userRes] = await Promise.all([
        fetch(`/api/schedule?section=${sectionFilter}`),
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
      if (userData.user) {
        setIsCRorAdmin(userData.user.role === "cr" || userData.user.role === "admin");
      }
    } catch (err) {
      console.error("Failed to load schedule", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [sectionFilter]);

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntry) return;

    await fetch("/api/schedule", {
      method: "PUT",
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
    if (!formCourseName.trim()) return;

    const startsAt = new Date(`${formDate || new Date().toISOString().slice(0, 10)}T${formStart}:00`).toISOString();
    const endsAt = new Date(`${formDate || new Date().toISOString().slice(0, 10)}T${formEnd}:00`).toISOString();

    await fetch("/api/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        course_id: `c-${Date.now()}`,
        course_code: formCourseName.slice(0, 8).toUpperCase(),
        course_name: formCourseName,
        faculty_name: formFacultyName || "Faculty TBA",
        room: formRoom,
        starts_at: startsAt,
        ends_at: endsAt,
        type: formType,
        status: "scheduled",
        section: sectionFilter,
      }),
    });

    setIsAddModalOpen(false);
    setFormCourseName("");
    setFormFacultyName("");
    loadData();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-150">
      {/* Schedule Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1c1c1f]">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-[#71717a] mb-1">
            <span>PGPX</span>
            <span>/</span>
            <span className="text-zinc-300">ACADEMICS</span>
            <span>/</span>
            <span>TIMETABLE</span>
          </div>
          <h1 className="text-lg sm:text-xl font-medium text-white tracking-tight">
            Class Schedule & Agenda
          </h1>
          <p className="text-xs text-[#71717a] mt-0.5">
            Real-time daily lectures, room changes, and whole-semester academic milestones.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/api/calendar/feed.ics"
            download="pgpx-calendar.ics"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#121214] hover:bg-[#18181b] border border-[#222226] text-xs text-[#a1a1aa] hover:text-white transition-colors"
          >
            <CalendarCheck className="w-3.5 h-3.5 text-[#71717a]" />
            <span>Export .ICS</span>
          </a>

          {isCRorAdmin && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-black font-medium text-xs hover:bg-[#eaeaea] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Session</span>
            </button>
          )}
        </div>
      </div>

      {/* View Switcher Tabs & Section Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1c1c1f] pb-3">
        <div className="flex items-center gap-1 bg-[#0c0c0e] p-1 rounded-lg border border-[#1e1e22]">
          <button
            onClick={() => setActiveTab("daily")}
            className={`px-3 py-1 rounded text-xs transition-colors ${
              activeTab === "daily"
                ? "bg-[#18181b] text-white font-medium border border-[#27272a]"
                : "text-[#71717a] hover:text-white"
            }`}
          >
            Today&apos;s Lectures
          </button>
          <button
            onClick={() => setActiveTab("weekly")}
            className={`px-3 py-1 rounded text-xs transition-colors ${
              activeTab === "weekly"
                ? "bg-[#18181b] text-white font-medium border border-[#27272a]"
                : "text-[#71717a] hover:text-white"
            }`}
          >
            Weekly Schedule
          </button>
          <button
            onClick={() => setActiveTab("semester")}
            className={`px-3 py-1 rounded text-xs transition-colors ${
              activeTab === "semester"
                ? "bg-[#18181b] text-white font-medium border border-[#27272a]"
                : "text-[#71717a] hover:text-white"
            }`}
          >
            Whole-Semester Agenda
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-[#71717a]" />
          <span className="text-[#71717a]">Section:</span>
          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="px-2.5 py-1 rounded bg-[#121214] border border-[#222226] text-white text-xs focus:outline-none"
          >
            <option value="A">Section A (Regular)</option>
            <option value="B">Section B (Electives)</option>
          </select>
        </div>
      </div>

      {/* Content for Daily / Weekly */}
      {(activeTab === "daily" || activeTab === "weekly") && (
        <div className="space-y-3">
          {schedule.length === 0 ? (
            <div className="p-12 rounded-xl border border-dashed border-[#1e1e22] bg-[#0c0c0e]/50 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-[#141416] border border-[#242428] flex items-center justify-center mx-auto text-[#71717a]">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h3 className="text-sm font-medium text-white">Class schedule to be updated</h3>
                <p className="text-xs text-[#71717a] leading-relaxed">
                  Check back once the official academic timetable is announced.
                </p>
              </div>
            </div>
          ) : (
            schedule.map((entry) => {
              const isRescheduled = entry.status === "rescheduled";
              return (
                <div
                  key={entry.id}
                  className={`p-4 rounded-xl border border-[#1e1e22] bg-[#0c0c0e] hover:border-[#2a2a30] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isRescheduled ? "border-[#3f3f46]" : ""
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#161619] text-zinc-300 border border-[#26262a]">
                        {entry.course_code}
                      </span>
                      <StatusBadge type="schedule" value={entry.status} />
                      {entry.changed_note && (
                        <span className="text-[11px] font-medium text-zinc-300 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {entry.changed_note}
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-medium text-white">
                      {entry.course_name}
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#71717a]">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {entry.room}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        {entry.faculty_name || "Faculty TBA"}
                      </span>
                      <span>•</span>
                      <span className="font-mono text-[#a1a1aa]">
                        {new Date(entry.starts_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        {" - "}
                        {new Date(entry.ends_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
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
                        className="px-2.5 py-1 rounded bg-[#141416] hover:bg-[#1a1a1e] border border-[#222226] text-xs text-zinc-300 hover:text-white transition-colors"
                      >
                        Reschedule
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Content for Whole-Semester Calendar */}
      {activeTab === "semester" && (
        <div className="space-y-4">
          {calendar.length === 0 ? (
            <div className="p-12 rounded-xl border border-dashed border-[#1e1e22] bg-[#0c0c0e]/50 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-[#141416] border border-[#242428] flex items-center justify-center mx-auto text-[#71717a]">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h3 className="text-sm font-medium text-white">Semester agenda to be updated</h3>
                <p className="text-xs text-[#71717a] leading-relaxed">
                  Academic milestones, term boundaries, and exam windows will appear here once announced.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {calendar.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-[#1e1e22] bg-[#0c0c0e] space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#161619] text-zinc-300 uppercase border border-[#26262a]">
                      {item.kind.replace("_", " ")}
                    </span>
                    <span className="text-xs font-mono text-[#71717a]">
                      {new Date(item.start_date).toLocaleDateString([], { month: "short", day: "numeric" })}
                      {item.start_date !== item.end_date && (
                        <> - {new Date(item.end_date).toLocaleDateString([], { month: "short", day: "numeric" })}</>
                      )}
                    </span>
                  </div>
                  <h4 className="text-xs font-medium text-white">{item.label || item.title}</h4>
                  {(item.notes || item.description) && (
                    <p className="text-[11px] text-[#71717a] leading-relaxed">{item.notes || item.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Session Modal (CR) */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Class or Quiz Slot"
        description="Schedule a lecture, guest session, or quiz slot for the batch."
      >
        <form onSubmit={handleAddSessionSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Course / Subject Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Corporate Finance"
              value={formCourseName}
              onChange={(e) => setFormCourseName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#121214] border border-[#222226] text-xs text-white placeholder-[#52525b] focus:outline-none focus:border-[#3a3a42]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Faculty Name
            </label>
            <input
              type="text"
              placeholder="e.g. Prof. Sharma (Optional)"
              value={formFacultyName}
              onChange={(e) => setFormFacultyName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#121214] border border-[#222226] text-xs text-white placeholder-[#52525b] focus:outline-none focus:border-[#3a3a42]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Room / Venue *
              </label>
              <input
                type="text"
                required
                value={formRoom}
                onChange={(e) => setFormRoom(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#121214] border border-[#222226] text-xs text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Session Type *
              </label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as any)}
                className="w-full px-2.5 py-2 rounded-lg bg-[#121214] border border-[#222226] text-xs text-white focus:outline-none"
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
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Date
              </label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full px-2.5 py-2 rounded-lg bg-[#121214] border border-[#222226] text-xs text-white focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={formStart}
                onChange={(e) => setFormStart(e.target.value)}
                className="w-full px-2.5 py-2 rounded-lg bg-[#121214] border border-[#222226] text-xs text-white focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                End Time
              </label>
              <input
                type="time"
                value={formEnd}
                onChange={(e) => setFormEnd(e.target.value)}
                className="w-full px-2.5 py-2 rounded-lg bg-[#121214] border border-[#222226] text-xs text-white focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#1c1c20]">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-3 py-1.5 rounded-lg text-xs text-[#71717a] hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-white text-black font-medium text-xs hover:bg-[#eaeaea] transition-colors"
            >
              Add Session
            </button>
          </div>
        </form>
      </Modal>

      {/* Reschedule Modal (CR) */}
      <Modal
        isOpen={isRescheduleModalOpen}
        onClose={() => setIsRescheduleModalOpen(false)}
        title="Reschedule Class Session"
        description="Notify the batch of room changes or altered lecture timings."
      >
        <form onSubmit={handleRescheduleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              New Room
            </label>
            <input
              type="text"
              value={newRoom}
              onChange={(e) => setNewRoom(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#121214] border border-[#222226] text-xs text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Change Reason / Note
            </label>
            <input
              type="text"
              placeholder="e.g. Shifted to Auditorium due to guest speaker"
              value={changeNote}
              onChange={(e) => setChangeNote(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#121214] border border-[#222226] text-xs text-white focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#1c1c20]">
            <button
              type="button"
              onClick={() => setIsRescheduleModalOpen(false)}
              className="px-3 py-1.5 rounded-lg text-xs text-[#71717a] hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-white text-black font-medium text-xs hover:bg-[#eaeaea] transition-colors"
            >
              Confirm Reschedule
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
