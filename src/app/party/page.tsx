"use client";

import { useEffect, useState } from "react";
import {
  Sparkles,
  Users,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  Car,
  Plus,
  Send,
  ShieldAlert,
  Wallet,
  Check,
  X,
  HelpCircle,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { PartyCategory, PartyEvent, PartyRSVPStatus, UserProfile } from "@/types";

export default function PartyPage() {
  const [events, setEvents] = useState<PartyEvent[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<PartyEvent | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCarpoolModalOpen, setIsCarpoolModalOpen] = useState(false);
  const [eventChatText, setEventChatText] = useState("");

  // Create form states
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState<PartyCategory>("House Party");
  const [formDate, setFormDate] = useState("");
  const [formTime, setFormTime] = useState("19:00");
  const [formVenue, setFormVenue] = useState("");
  const [formBudget, setFormBudget] = useState("500");
  const [formCapacity, setFormCapacity] = useState("40");
  const [formDescription, setFormDescription] = useState("");
  const [formCover, setFormCover] = useState("");

  const loadEvents = async () => {
    try {
      const [eventsRes, userRes] = await Promise.all([
        fetch("/api/party"),
        fetch("/api/auth/me"),
      ]);
      const [eventsData, userData] = await Promise.all([
        eventsRes.json(),
        userRes.json(),
      ]);
      if (eventsData.events) {
        setEvents(eventsData.events);
        if (!selectedEvent && eventsData.events.length > 0) {
          setSelectedEvent(eventsData.events[0]);
        } else if (selectedEvent) {
          const updated = eventsData.events.find((e: PartyEvent) => e.id === selectedEvent.id);
          if (updated) setSelectedEvent(updated);
        }
      }
      if (userData.user) setCurrentUser(userData.user);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleRSVP = async (eventId: string, status: PartyRSVPStatus) => {
    await fetch("/api/party", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "rsvp", event_id: eventId, status }),
    });
    loadEvents();
  };

  const handleVotePoll = async (eventId: string, pollId: string, optionId: string) => {
    await fetch("/api/party", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "vote_poll", event_id: eventId, poll_id: pollId, option_id: optionId }),
    });
    loadEvents();
  };

  const handleClaimItem = async (eventId: string, itemId: string) => {
    await fetch("/api/party", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "claim_item", event_id: eventId, item_id: itemId }),
    });
    loadEvents();
  };

  const handleSendEventMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent || !eventChatText.trim()) return;

    await fetch("/api/party", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "send_message",
        event_id: selectedEvent.id,
        message: eventChatText,
      }),
    });
    setEventChatText("");
    loadEvents();
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formDate || !formVenue) return;

    const startsAt = new Date(`${formDate}T${formTime || "19:00"}:00`).toISOString();

    await fetch("/api/party", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create_event",
        title: formTitle,
        category: formCategory,
        starts_at: startsAt,
        venue: formVenue,
        budget_per_head: Number(formBudget) || 0,
        capacity: Number(formCapacity) || undefined,
        description: formDescription,
        cover_image: formCover || undefined,
        visibility: "public_batch",
      }),
    });

    setIsCreateModalOpen(false);
    setFormTitle("");
    setFormVenue("");
    setFormDescription("");
    loadEvents();
  };

  const categories: PartyCategory[] = [
    "House Party",
    "Dinner",
    "Trip",
    "Movie Night",
    "Sports",
    "Birthday",
    "Celebration",
    "Other",
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Campus Rules Reminder */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-400" />
            Party & Batch Socials
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Private batch hub for planning house parties, dinners, weekend trips, and carpools.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs shadow-glow transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Plan Event</span>
        </button>
      </div>

      {/* House Rules & Safe Transport Banner */}
      <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/20 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-zinc-300 space-y-1">
          <span className="font-semibold text-amber-300">Campus House Rules & Safe Transit: </span>
          <span>
            Events are visible strictly to verified PGPx batch members. Respect campus regulations, drink responsibly, and ensure safe transport. Never drink and drive — coordinate designated drivers or group cabs below.
          </span>
        </div>
      </div>

      {/* Master-Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col (1 Col): Events List */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-zinc-400 uppercase font-mono tracking-wider px-1">
            Active Batch Plans ({events.length})
          </div>

          {events.map((evt) => {
            const isSelected = selectedEvent?.id === evt.id;
            return (
              <div
                key={evt.id}
                onClick={() => setSelectedEvent(evt)}
                className={`p-4 rounded-2xl cursor-pointer transition-all border ${
                  isSelected
                    ? "bg-zinc-900 border-amber-500/40 shadow-xl"
                    : "glass-panel hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-amber-300">
                    {evt.category}
                  </span>
                  <span className="text-xs font-mono text-zinc-400">
                    ₹{evt.budget_per_head}/head
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-white">{evt.title}</h3>

                <div className="mt-2 flex items-center justify-between text-xs text-zinc-400">
                  <span className="flex items-center gap-1 text-[11px]">
                    <MapPin className="w-3 h-3 text-zinc-400" />
                    {evt.venue}
                  </span>
                  <span className="font-mono text-emerald-400 text-[11px] font-medium">
                    {evt.headcount.going} Going
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Col (2 Cols): Selected Event Detail Hub */}
        {selectedEvent ? (
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl glass-panel space-y-5">
              {/* Event Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-white/10 pb-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      {selectedEvent.category}
                    </span>
                    <span className="text-xs text-zinc-400 font-mono">
                      Hosted by {selectedEvent.host_name}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    {selectedEvent.title}
                  </h2>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-300 pt-1">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                      {new Date(selectedEvent.starts_at).toLocaleDateString([], {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                      {selectedEvent.venue}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5 font-mono">
                      <Wallet className="w-3.5 h-3.5 text-zinc-400" />
                      Est. ₹{selectedEvent.budget_per_head} / person
                    </span>
                  </div>
                </div>

                {/* Carpool CTA */}
                <button
                  onClick={() => setIsCarpoolModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-medium transition-colors shrink-0"
                >
                  <Car className="w-3.5 h-3.5" />
                  <span>Need a Ride / Carpool</span>
                </button>
              </div>

              {/* RSVP Action Buttons */}
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-white">Your RSVP Status</div>
                  <div className="text-[11px] text-zinc-400">
                    Live headcount: {selectedEvent.headcount.going} Going • {selectedEvent.headcount.maybe} Maybe • {selectedEvent.headcount.cant} Can&apos;t
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRSVP(selectedEvent.id, "going")}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selectedEvent.user_rsvp === "going"
                        ? "bg-emerald-600 text-white shadow-glow"
                        : "bg-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Going</span>
                  </button>
                  <button
                    onClick={() => handleRSVP(selectedEvent.id, "maybe")}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selectedEvent.user_rsvp === "maybe"
                        ? "bg-amber-600 text-white"
                        : "bg-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Maybe</span>
                  </button>
                  <button
                    onClick={() => handleRSVP(selectedEvent.id, "cant")}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selectedEvent.user_rsvp === "cant"
                        ? "bg-rose-600 text-white"
                        : "bg-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Can&apos;t</span>
                  </button>
                </div>
              </div>

              {/* Event Description */}
              {selectedEvent.description && (
                <div className="text-xs text-zinc-300 leading-relaxed">
                  {selectedEvent.description}
                </div>
              )}

              {/* Date/Venue Polls */}
              {selectedEvent.polls && selectedEvent.polls.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-white/10">
                  <div className="text-xs font-semibold text-white">
                    Timing & Venue Poll
                  </div>
                  {selectedEvent.polls.map((poll) => (
                    <div key={poll.id} className="p-3.5 rounded-xl bg-zinc-900 border border-white/5 space-y-2">
                      <div className="text-xs text-zinc-300 font-medium">{poll.question}</div>
                      <div className="space-y-1.5">
                        {poll.options.map((opt) => {
                          const isVoted = poll.user_voted_option_id === opt.id;
                          return (
                            <button
                              key={opt.id}
                              onClick={() => handleVotePoll(selectedEvent.id, poll.id, opt.id)}
                              className={`w-full flex items-center justify-between p-2 rounded-lg text-xs text-left border transition-all ${
                                isVoted
                                  ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                                  : "bg-zinc-950 border-white/5 text-zinc-400 hover:text-white"
                              }`}
                            >
                              <span>{opt.text}</span>
                              <span className="font-mono text-[11px] font-bold">
                                {opt.vote_count} votes
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Checklist & Split Tracker */}
              {selectedEvent.checklist && (
                <div className="space-y-3 pt-3 border-t border-white/10">
                  <div className="text-xs font-semibold text-white flex items-center justify-between">
                    <span>What to Bring / Supplies Checklist</span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      Click to claim an item
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {selectedEvent.checklist.map((item) => {
                      const isClaimedByMe = item.claimed_by === currentUser?.id;
                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/60 border border-white/5 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleClaimItem(selectedEvent.id, item.id)}
                              className={`p-1 rounded-md text-xs font-mono transition-colors ${
                                item.claimed_by
                                  ? "bg-emerald-500/20 text-emerald-300"
                                  : "bg-zinc-800 text-zinc-500 hover:text-white"
                              }`}
                            >
                              {item.claimed_by ? "Claimed" : "Claim"}
                            </button>
                            <span className="text-zinc-200">{item.item}</span>
                          </div>

                          <span className="text-[11px] text-zinc-400 font-mono">
                            {item.claimed_by_name ? `Claimed by ${item.claimed_by_name}` : "Open"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Event Chat Thread */}
              <div className="space-y-3 pt-3 border-t border-white/10">
                <div className="text-xs font-semibold text-white">
                  Event Discussion Thread
                </div>
                <div className="max-h-48 overflow-y-auto space-y-2 p-2 rounded-xl bg-zinc-900/40 border border-white/5">
                  {selectedEvent.messages && selectedEvent.messages.length > 0 ? (
                    selectedEvent.messages.map((m) => (
                      <div key={m.id} className="text-xs space-y-0.5">
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono">
                          <span className="text-amber-400 font-medium">{m.user_name}</span>
                          <span>•</span>
                          <span>{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                        <div className="text-zinc-300 leading-relaxed">{m.body}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-zinc-500 py-3 text-center">
                      No comments yet. Coordinate logistics here!
                    </div>
                  )}
                </div>

                <form onSubmit={handleSendEventMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={eventChatText}
                    onChange={(e) => setEventChatText(e.target.value)}
                    placeholder="Post to event attendees..."
                    className="flex-1 bg-zinc-900 border border-white/10 px-3 py-1.5 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 text-center py-16 glass-panel rounded-2xl">
            Select an event to view details.
          </div>
        )}
      </div>

      {/* Plan Event Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Batch Social Event"
        description="Organize a dinner, house party, sports meetup, or celebration for the PGPx batch."
      >
        <form onSubmit={handleCreateEvent} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Event Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Saturday Night Falcon Rooftop Jam"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Vibe / Category *
              </label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value as PartyCategory)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-500"
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
                Estimated Budget Per Head (₹)
              </label>
              <input
                type="number"
                value={formBudget}
                onChange={(e) => setFormBudget(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Date *
              </label>
              <input
                type="date"
                required
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Time
              </label>
              <input
                type="time"
                value={formTime}
                onChange={(e) => setFormTime(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Venue / Area *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Sector 14 Falcon Heights or CyberHub Gurugram"
              value={formVenue}
              onChange={(e) => setFormVenue(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Description & Details
            </label>
            <textarea
              rows={2}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="What to expect, BYOB guidelines, dress code, catering plans..."
              className="w-full px-3.5 py-2 rounded-lg bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs shadow-glow transition-all"
            >
              Publish Event
            </button>
          </div>
        </form>
      </Modal>

      {/* Carpool Coordination Modal */}
      <Modal
        isOpen={isCarpoolModalOpen}
        onClose={() => setIsCarpoolModalOpen(false)}
        title="Carpool & Shared Transit Board"
        description="Share cabs or offer empty car seats between Rohtak campus, Delhi NCR, and event venues."
      >
        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-500/20 text-blue-300">
            Designated safety notice: Never drink and drive. Coordinate shared rides below with fellow batchmates.
          </div>

          <div className="space-y-2">
            <div className="p-3 rounded-xl bg-zinc-900 border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-zinc-300">
                <span className="font-semibold text-white">Rahul Verma&apos;s Car</span>
                <span className="font-mono text-emerald-400">2 Seats Available</span>
              </div>
              <div className="text-zinc-400">
                Leaving from Campus Gate 2 at 6:15 PM sharp. Destination: Sector 14.
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-900 border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-zinc-300">
                <span className="font-semibold text-white">Uber XL Pool (Priya P)</span>
                <span className="font-mono text-amber-400">Splitting Fare 4-ways</span>
              </div>
              <div className="text-zinc-400">
                Booking from Hostel Block B lobby at 6:45 PM.
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-white/10">
            <button
              onClick={() => setIsCarpoolModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
