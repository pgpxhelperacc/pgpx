"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { ReminderCategory } from "@/types";

interface AddReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReminderAdded?: () => void;
}

export function AddReminderModal({
  isOpen,
  onClose,
  onReminderAdded,
}: AddReminderModalProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ReminderCategory>("Quiz");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("23:59");
  const [courseCode, setCourseCode] = useState("c-1");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dueDate) {
      setError("Please fill out Title and Due Date");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const fullDueDate = new Date(`${dueDate}T${dueTime || "23:59"}:00`).toISOString();
      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category,
          due_at: fullDueDate,
          course_id: courseCode,
          description,
          link,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create reminder");
      }

      setTitle("");
      setDescription("");
      setLink("");
      onClose();
      if (onReminderAdded) onReminderAdded();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const categories: ReminderCategory[] = [
    "Assignment",
    "Quiz",
    "Exam",
    "Submission",
    "Event",
    "Holiday",
    "Other",
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Important Date or Deadline"
      description="Contribute a quiz date, submission deadline, or batch event. CRs can verify entries to prevent date tampering."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
            Event Title *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. STRAT-601 Case 3 Group Submission"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2 rounded-lg bg-zinc-900 border border-white/10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ReminderCategory)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Course (Optional)
            </label>
            <select
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="c-1">STRAT-601 (Strategic Mgmt)</option>
              <option value="c-2">FIN-602 (Corporate Valuation)</option>
              <option value="c-3">OPS-603 (Supply Chain)</option>
              <option value="c-4">MKT-604 (Digital Marketing)</option>
              <option value="c-5">LEAD-605 (Executive Leadership)</option>
              <option value="">None / General Batch</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Due Date *
            </label>
            <input
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Time (24h)
            </label>
            <input
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
            Portal Link / Moodle URL (Optional)
          </label>
          <input
            type="url"
            placeholder="https://moodle.iimrohtak.ac.in/..."
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="w-full px-3.5 py-2 rounded-lg bg-zinc-900 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
            Brief Notes / Instructions
          </label>
          <textarea
            rows={2}
            placeholder="Format requirements, team guidelines, or submission portal link..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2 rounded-lg bg-zinc-900 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 resize-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs text-zinc-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-glow transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? "Publishing..." : "Publish Reminder"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
