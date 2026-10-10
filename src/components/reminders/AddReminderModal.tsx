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
  const [courseCode, setCourseCode] = useState("");
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
          course_id: courseCode || undefined,
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
      setCourseCode("");
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
      description="Publish an upcoming quiz date, project submission, or exam window for the batch."
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {error && (
          <div className="p-2.5 rounded-lg bg-[#141416] border border-[#26262a] text-zinc-300 text-xs">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1">
            Event Title *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Case Study 3 Submission / Quiz 1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#121214] border border-[#222226] text-xs text-white placeholder-[#52525b] focus:outline-none focus:border-[#3a3a42]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ReminderCategory)}
              className="w-full px-2.5 py-2 rounded-lg bg-[#121214] border border-[#222226] text-xs text-white focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Subject / Course (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Marketing, Finance, etc."
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#121214] border border-[#222226] text-xs text-white placeholder-[#52525b] focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Due Date *
            </label>
            <input
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-2.5 py-2 rounded-lg bg-[#121214] border border-[#222226] text-xs text-white focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Time
            </label>
            <input
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              className="w-full px-2.5 py-2 rounded-lg bg-[#121214] border border-[#222226] text-xs text-white focus:outline-none font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1">
            Reference Link / Submission Portal (Optional)
          </label>
          <input
            type="url"
            placeholder="https://..."
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#121214] border border-[#222226] text-xs text-white placeholder-[#52525b] focus:outline-none font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1">
            Notes / Guidelines (Optional)
          </label>
          <textarea
            rows={2}
            placeholder="Format requirements, team guidelines, or case details..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#121214] border border-[#222226] text-xs text-white placeholder-[#52525b] focus:outline-none resize-none"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1c1c20]">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs text-[#71717a] hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-1.5 rounded-lg bg-white hover:bg-[#eaeaea] text-black font-medium text-xs transition-colors disabled:opacity-50"
          >
            {loading ? "Publishing..." : "Publish Date"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
