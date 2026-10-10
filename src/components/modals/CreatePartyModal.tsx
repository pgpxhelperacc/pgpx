"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";

interface CreatePartyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export function CreatePartyModal({
  isOpen,
  onClose,
  onCreated,
}: CreatePartyModalProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Dinner");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("20:00");
  const [venue, setVenue] = useState("");
  const [budget, setBudget] = useState("1000");
  const [capacity, setCapacity] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !venue) {
      setError("Please fill out Title, Date and Venue");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const startsAt = new Date(`${date}T${time || "20:00"}:00`).toISOString();
      const res = await fetch("/api/party", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_event",
          title,
          category,
          starts_at: startsAt,
          venue,
          budget_per_head: budget ? Number(budget) : 0,
          capacity: capacity ? Number(capacity) : undefined,
          description,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create party/social event");
      }

      setTitle("");
      setVenue("");
      setDescription("");
      onClose();
      if (onCreated) onCreated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    "Dinner",
    "Night Out",
    "Mixer",
    "Birthday",
    "Trip",
    "Sports",
    "Celebration",
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Party / Social Event"
      description="Plan an off-campus dinner, batch celebration, or weekend outing."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs">
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
            placeholder="e.g. Post-Midterm Batch Dinner @ Sector 29"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
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
              Venue / Location *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. CyberHub, Gurgaon"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Event Date *
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-2.5 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Time
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-2.5 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Budget Per Head (₹)
            </label>
            <input
              type="number"
              placeholder="1000"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Max Capacity (Optional)
            </label>
            <input
              type="number"
              placeholder="No limit"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
            Details & Notes
          </label>
          <textarea
            rows={2}
            placeholder="Cab pooling details, dress code, payment link..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 resize-none"
          />
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
            {loading ? "Creating..." : "Plan Event"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
