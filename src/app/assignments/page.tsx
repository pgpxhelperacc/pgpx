"use client";

import { useEffect, useState } from "react";
import {
  FileCheck2,
  ExternalLink,
  CheckCircle2,
  Clock,
  Circle,
  Bell,
  Settings,
  Shield,
  Layers,
} from "lucide-react";
import { CountdownTimer } from "@/components/ui/CountdownTimer";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { Assignment } from "@/types";

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filterType, setFilterType] = useState<"all" | "individual" | "group">("all");
  const [isAlertSettingsOpen, setIsAlertSettingsOpen] = useState(false);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(true);
  const [selectedOffsets, setSelectedOffsets] = useState<number[]>([4320, 1440, 180, 30]); // 3d, 1d, 3h, 30m

  const loadAssignments = async () => {
    try {
      const res = await fetch("/api/assignments");
      const data = await res.json();
      if (data.assignments) setAssignments(data.assignments);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, []);

  const handleStatusChange = async (
    assignmentId: string,
    newStatus: "not_started" | "in_progress" | "done"
  ) => {
    // Optimistic UI update
    setAssignments((prev) =>
      prev.map((a) => (a.id === assignmentId ? { ...a, user_status: newStatus } : a))
    );

    await fetch("/api/assignments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignment_id: assignmentId, status: newStatus }),
    });
  };

  const filtered = assignments.filter((a) => {
    if (filterType === "all") return true;
    return a.type === filterType;
  });

  const offsetsList = [
    { label: "3 Days Before (72h)", value: 4320 },
    { label: "1 Day Before (24h)", value: 1440 },
    { label: "3 Hours Before", value: 180 },
    { label: "30 Minutes Before", value: 30 },
  ];

  const toggleOffset = (val: number) => {
    if (selectedOffsets.includes(val)) {
      setSelectedOffsets(selectedOffsets.filter((o) => o !== val));
    } else {
      setSelectedOffsets([...selectedOffsets, val]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <FileCheck2 className="w-6 h-6 text-purple-400" />
            Upcoming Assignments & Course Weightages
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Track individual & group project deliverables with personal private progress checkboxes.
          </p>
        </div>

        <button
          onClick={() => setIsAlertSettingsOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs text-zinc-300 hover:text-white transition-colors"
        >
          <Bell className="w-3.5 h-3.5 text-blue-400" />
          <span>Deadline Alert Offsets</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-white/10 text-xs">
          <button
            onClick={() => setFilterType("all")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterType === "all"
                ? "bg-white/10 text-white font-medium"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            All Submissions ({assignments.length})
          </button>
          <button
            onClick={() => setFilterType("group")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterType === "group"
                ? "bg-white/10 text-white font-medium"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Group Deliverables
          </button>
          <button
            onClick={() => setFilterType("individual")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterType === "individual"
                ? "bg-white/10 text-white font-medium"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Individual Tasks
          </button>
        </div>

        <div className="text-xs text-zinc-500 font-mono hidden sm:block">
          Personal progress is 100% private
        </div>
      </div>

      {/* Assignment List */}
      <div className="space-y-3">
        {filtered.map((asg) => {
          const status = asg.user_status || "not_started";
          return (
            <div
              key={asg.id}
              className={`p-5 rounded-2xl glass-panel transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                status === "done" ? "opacity-75 border-emerald-500/20" : ""
              }`}
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-200">
                    {asg.course_code}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 uppercase">
                    {asg.type}
                  </span>
                  {asg.weightage && (
                    <span className="text-[10px] font-mono text-zinc-400">
                      Weight: {asg.weightage}% of grade
                    </span>
                  )}
                  <StatusBadge type="progress" value={status} />
                </div>

                <h3 className={`text-base font-semibold text-white ${status === "done" ? "line-through text-zinc-400" : ""}`}>
                  {asg.title}
                </h3>

                {asg.description && (
                  <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
                    {asg.description}
                  </p>
                )}

                {asg.submission_url && (
                  <a
                    href={asg.submission_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-400 hover:underline pt-1"
                  >
                    <span>Moodle Portal Submission Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 shrink-0">
                <div className="text-right">
                  <CountdownTimer targetDate={asg.due_at} variant="pill" />
                  <div className="text-[10px] font-mono text-zinc-400 mt-1">
                    Due:{" "}
                    {new Date(asg.due_at).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>

                {/* Personal Status Buttons */}
                <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-white/5">
                  <button
                    onClick={() => handleStatusChange(asg.id, "not_started")}
                    className={`px-2 py-1 rounded-lg text-[10px] font-mono transition-colors ${
                      status === "not_started"
                        ? "bg-zinc-800 text-white font-medium"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    To Do
                  </button>
                  <button
                    onClick={() => handleStatusChange(asg.id, "in_progress")}
                    className={`px-2 py-1 rounded-lg text-[10px] font-mono transition-colors ${
                      status === "in_progress"
                        ? "bg-amber-500/20 text-amber-300 font-medium"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    In Progress
                  </button>
                  <button
                    onClick={() => handleStatusChange(asg.id, "done")}
                    className={`px-2 py-1 rounded-lg text-[10px] font-mono transition-colors ${
                      status === "done"
                        ? "bg-emerald-500/20 text-emerald-300 font-medium"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deadline Alert Preferences Modal */}
      <Modal
        isOpen={isAlertSettingsOpen}
        onClose={() => setIsAlertSettingsOpen(false)}
        title="Deadline Alert Channels & Offsets"
        description="Automated alerts dispatched by the Render background worker. Delivered via Web Push and institute email."
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="text-xs font-medium text-white">Delivery Channels</div>
            <div className="space-y-2">
              <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-white/5 text-xs text-zinc-300 cursor-pointer">
                <span>Email Notifications (@iimrohtak.ac.in via Resend)</span>
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="rounded bg-zinc-800 border-zinc-700 text-blue-500 focus:ring-0"
                />
              </label>
              <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-white/5 text-xs text-zinc-300 cursor-pointer">
                <span>Web Push Notifications (PWA installable on phone)</span>
                <input
                  type="checkbox"
                  checked={pushAlerts}
                  onChange={(e) => setPushAlerts(e.target.checked)}
                  className="rounded bg-zinc-800 border-zinc-700 text-blue-500 focus:ring-0"
                />
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-medium text-white">Alert Timing Offsets Before Due Date</div>
            <div className="grid grid-cols-2 gap-2">
              {offsetsList.map((off) => {
                const isSelected = selectedOffsets.includes(off.value);
                return (
                  <button
                    key={off.value}
                    type="button"
                    onClick={() => toggleOffset(off.value)}
                    className={`p-2.5 rounded-xl text-xs font-mono border transition-all text-left flex items-center justify-between ${
                      isSelected
                        ? "bg-blue-500/10 border-blue-500/30 text-blue-300 font-medium"
                        : "bg-zinc-900 border-white/5 text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    <span>{off.label}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-white/10 flex justify-end">
            <button
              onClick={() => setIsAlertSettingsOpen(false)}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-glow transition-all active:scale-95"
            >
              Save Alert Preferences
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
