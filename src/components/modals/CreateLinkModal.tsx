"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";

interface CreateLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export function CreateLinkModal({
  isOpen,
  onClose,
  onCreated,
}: CreateLinkModalProps) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("Course Portal");
  const [expiresAt, setExpiresAt] = useState("");
  const [pinned, setPinned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !url) {
      setError("Please fill out Title and URL");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          url,
          category,
          expires_at: expiresAt ? new Date(expiresAt).toISOString() : undefined,
          pinned,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create link");
      }

      setTitle("");
      setUrl("");
      setExpiresAt("");
      setPinned(false);
      onClose();
      if (onCreated) onCreated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    "Course Portal",
    "Academic",
    "Admin",
    "Case Studies",
    "Tools",
    "General",
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Link / Resource"
      description="Add a verified portal link, classroom sheet, or case study resource for the batch."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
            Resource Title *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Term 4 Case Studies Drive / Attendance Sheet"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
            URL *
          </label>
          <input
            type="url"
            required
            placeholder="https://drive.google.com/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 font-mono"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-2.5 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none"
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
              Expires On (Optional)
            </label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full px-2.5 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none font-mono"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="pinned-checkbox"
            checked={pinned}
            onChange={(e) => setPinned(e.target.checked)}
            className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-white accent-white focus:ring-0"
          />
          <label htmlFor="pinned-checkbox" className="text-xs text-zinc-400">
            Pin to top of Important Links
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-white hover:bg-zinc-200 text-black transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add Link"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
