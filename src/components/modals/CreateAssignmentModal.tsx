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
  const [courseCode, setCourseCode] = useState("STRAT-601");
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
          course_id: "c-1",
          course_code: courseCode,
          course_name: "Strategic Management",
          type,
          weightage: Number(weightage) || 0,
          due_at: dueAt,
          submission_url: submissionUrl,
          description,
        }),
      });

      if (res.ok) {
        setTitle("");
        setDescription("");
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
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
            Assignment Title *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Valuation Case 3 Model (Tesla vs BYD)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Course
            </label>
            <select
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              className="w-full px-2.5 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none"
            >
              <option value="STRAT-601">STRAT-601</option>
              <option value="FIN-602">FIN-602</option>
              <option value="OPS-603">OPS-603</option>
              <option value="MKT-604">MKT-604</option>
              <option value="LEAD-605">LEAD-605</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full px-2.5 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none"
            >
              <option value="group">Group</option>
              <option value="individual">Individual</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Weight (%)
            </label>
            <input
              type="number"
              value={weightage}
              onChange={(e) => setWeightage(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none"
            />
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
              className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Time
            </label>
            <input
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
            Submission Portal Link
          </label>
          <input
            type="url"
            placeholder="https://moodle.iimrohtak.ac.in/..."
            value={submissionUrl}
            onChange={(e) => setSubmissionUrl(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-1.5 rounded-lg bg-white text-black font-medium text-xs hover:bg-zinc-200 transition-colors"
          >
            Publish Assignment
          </button>
        </div>
      </form>
    </Modal>
  );
}
