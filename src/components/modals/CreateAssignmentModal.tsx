"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";

interface CreateAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export function CreateAssignmentModal({
  isOpen,
  onClose,
  onCreated,
}: CreateAssignmentModalProps) {
  const [title, setTitle] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [type, setType] = useState<"individual" | "group">("group");
  const [weightage, setWeightage] = useState("20");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("23:59");
  const [submissionUrl, setSubmissionUrl] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dueDate) return;

    setLoading(true);
    try {
      const dueAt = new Date(`${dueDate}T${dueTime || "23:59"}:00`).toISOString();
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          course_id: `c-${Date.now()}`,
          course_code: courseCode || "GENERAL",
          course_name: courseCode || "General Assignment",
          type,
          weightage: Number(weightage) || 0,
          due_at: dueAt,
          submission_url: submissionUrl,
          description,
        }),
      });

      if (res.ok) {
        setTitle("");
        setCourseCode("");
        setDescription("");
        setSubmissionUrl("");
        onClose();
        if (onCreated) onCreated();
      }
    } catch (err) {
      // silent
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Assignment"
      description="Publish an assignment deliverable with due date, weightage, and submission portal."
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1">
            Assignment Title *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Case Study 2 Valuation Model / Term Paper"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#121214] border border-[#222226] text-xs text-white placeholder-[#52525b] focus:outline-none focus:border-[#3a3a42]"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Subject / Course
            </label>
            <input
              type="text"
              placeholder="e.g. Marketing"
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#121214] border border-[#222226] text-xs text-white placeholder-[#52525b] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full px-2.5 py-2 rounded-lg bg-[#121214] border border-[#222226] text-xs text-white focus:outline-none"
            >
              <option value="group">Group</option>
              <option value="individual">Individual</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Weight (%)
            </label>
            <input
              type="number"
              value={weightage}
              onChange={(e) => setWeightage(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#121214] border border-[#222226] text-xs text-white focus:outline-none font-mono"
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
            Submission Portal Link (Optional)
          </label>
          <input
            type="url"
            placeholder="https://moodle.iimrohtak.ac.in/..."
            value={submissionUrl}
            onChange={(e) => setSubmissionUrl(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#121214] border border-[#222226] text-xs text-white placeholder-[#52525b] focus:outline-none font-mono"
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-[#1c1c20]">
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
            className="px-4 py-1.5 rounded-lg bg-white text-black font-medium text-xs hover:bg-[#eaeaea] transition-colors"
          >
            Publish Assignment
          </button>
        </div>
      </form>
    </Modal>
  );
}
