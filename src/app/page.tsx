"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  FileCheck2,
  Bookmark,
  MessageSquare,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  MapPin,
  ExternalLink,
  Users,
} from "lucide-react";
import { CountdownTimer } from "@/components/ui/CountdownTimer";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  ScheduleEntry,
  Reminder,
  Assignment,
  ImportantLink,
  PartyEvent,
  UserProfile,
} from "@/types";

export default function DashboardPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [nextClass, setNextClass] = useState<ScheduleEntry | null>(null);
  const [todaySchedule, setTodaySchedule] = useState<ScheduleEntry[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [links, setLinks] = useState<ImportantLink[]>([]);
  const [partyEvents, setPartyEvents] = useState<PartyEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [userRes, schRes, remRes, asgRes, lnkRes, ptyRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/schedule?filter=today"),
          fetch("/api/reminders"),
          fetch("/api/assignments"),
          fetch("/api/links"),
          fetch("/api/party"),
        ]);

        const [userData, schData, remData, asgData, lnkData, ptyData] = await Promise.all([
          userRes.json(),
          schRes.json(),
          remRes.json(),
          asgRes.json(),
          lnkRes.json(),
          ptyRes.json(),
        ]);

        if (userData.user) setUser(userData.user);
        if (schData.schedule) setTodaySchedule(schData.schedule);
        if (schData.nextClass) setNextClass(schData.nextClass);
        if (remData.reminders) setReminders(remData.reminders.slice(0, 4));
        if (asgData.assignments) setAssignments(asgData.assignments.slice(0, 3));
        if (lnkData.links) setLinks(lnkData.links.slice(0, 4));
        if (ptyData.events) setPartyEvents(ptyData.events.slice(0, 2));
      } catch (err) {
        console.error("Dashboard data load error", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const expiringLinks = links.filter((l) => l.expires_at);

  return (
    <div className="space-y-6">
      {/* Top Welcome & Context Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-black border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {user?.batch || "PGPx06"} • {user?.term || "Term 4"}
            </span>
            <span className="text-xs text-zinc-400">• Section {user?.section || "A"}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Welcome back, {user?.name || "Student"}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            One place to know what&apos;s due, what&apos;s changed, and what&apos;s the link.
          </p>
        </div>

        {/* Quick Stats Grid */}
        <div className="flex items-center gap-3 shrink-0 relative z-10">
          <div className="px-4 py-2.5 rounded-xl bg-zinc-900/80 border border-white/10 text-center">
            <div className="text-lg font-bold text-white font-mono">
              {todaySchedule.length}
            </div>
            <div className="text-[10px] text-zinc-400 font-mono uppercase">Classes Today</div>
          </div>
          <div className="px-4 py-2.5 rounded-xl bg-zinc-900/80 border border-white/10 text-center">
            <div className="text-lg font-bold text-amber-400 font-mono">
              {assignments.length}
            </div>
            <div className="text-[10px] text-zinc-400 font-mono uppercase">Assignments Due</div>
          </div>
          <div className="px-4 py-2.5 rounded-xl bg-zinc-900/80 border border-white/10 text-center">
            <div className="text-lg font-bold text-purple-400 font-mono">
              {partyEvents.length}
            </div>
            <div className="text-[10px] text-zinc-400 font-mono uppercase">Batch Events</div>
          </div>
        </div>
      </div>

      {/* Next Class Widget & Live Countdown */}
      {nextClass ? (
        <div className="p-5 rounded-2xl glass-panel border border-blue-500/30 bg-blue-950/15 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Next Up Today
                </span>
                <StatusBadge type="schedule" value={nextClass.status} />
                {nextClass.changed_note && (
                  <span className="text-[11px] text-amber-400 font-medium">
                    ({nextClass.changed_note})
                  </span>
                )}
              </div>
              <h2 className="text-lg font-semibold text-white">
                {nextClass.course_code}: {nextClass.course_name}
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                  {nextClass.room}
                </span>
                <span>•</span>
                <span>{nextClass.faculty_name}</span>
                <span>•</span>
                <span className="font-mono text-zinc-300">
                  {new Date(nextClass.starts_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  {" - "}
                  {new Date(nextClass.ends_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <CountdownTimer
                targetDate={nextClass.starts_at}
                label="Class Starts in"
                variant="pill"
              />
              <Link
                href="/schedule"
                className="p-2 rounded-lg bg-white/10 hover:bg-white/15 text-white transition-colors"
                title="View Full Schedule"
              >
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-zinc-950 border border-white/10 flex items-center justify-between">
          <div className="text-xs text-zinc-400">
            No further lectures scheduled for today. Check upcoming sessions in the schedule tab.
          </div>
          <Link
            href="/schedule"
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            Schedule <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* Main Grid: Deadlines + Assignments + Links + Socials */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Urgent Dates & Upcoming Assignments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Important Dates / Reminders */}
          <div className="p-5 rounded-2xl glass-panel space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-semibold text-white">
                  Important Dates & Deadlines
                </h3>
              </div>
              <Link
                href="/reminders"
                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                <span>View all ({reminders.length})</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-2.5">
              {reminders.map((rem) => (
                <div
                  key={rem.id}
                  className="p-3.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-900 border border-white/5 hover:border-white/15 transition-all flex items-start justify-between gap-3 group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <StatusBadge type="category" value={rem.category} />
                      {rem.is_verified && (
                        <StatusBadge type="verification" value="verified" />
                      )}
                      <span className="text-[11px] text-zinc-400 font-mono">
                        Added by {rem.creator_name}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-white group-hover:text-blue-300 transition-colors">
                      {rem.title}
                    </div>
                    {rem.description && (
                      <p className="text-xs text-zinc-400 line-clamp-1">
                        {rem.description}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 text-right space-y-1">
                    <CountdownTimer targetDate={rem.due_at} variant="compact" />
                    <div className="text-[10px] text-zinc-400 font-mono">
                      {new Date(rem.due_at).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Assignments */}
          <div className="p-5 rounded-2xl glass-panel space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-semibold text-white">
                  Upcoming Assignments & Weights
                </h3>
              </div>
              <Link
                href="/assignments"
                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                <span>View all</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-2.5">
              {assignments.map((asg) => (
                <div
                  key={asg.id}
                  className="p-3.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-900 border border-white/5 hover:border-white/15 transition-all flex items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                        {asg.course_code}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400 uppercase">
                        {asg.type} • Weight {asg.weightage}%
                      </span>
                      <StatusBadge type="progress" value={asg.user_status || "not_started"} />
                    </div>
                    <div className="text-sm font-medium text-white">
                      {asg.title}
                    </div>
                  </div>

                  <div className="shrink-0 text-right space-y-1">
                    <CountdownTimer targetDate={asg.due_at} variant="compact" />
                    {asg.submission_url && (
                      <a
                        href={asg.submission_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-blue-400 hover:underline flex items-center justify-end gap-1"
                      >
                        Portal <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Links, Chat Pill, Party Highlights */}
        <div className="space-y-6">
          {/* Anonymous Chat Quick Callout */}
          <Link
            href="/chat"
            className="block p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-zinc-950 border border-indigo-500/30 hover:border-indigo-500/50 transition-all shadow-xl group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                Anonymous Batch Lounge
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                24h Purge
              </span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Real-time peer chat with daily rotating pseudonyms. All messages are hard-deleted every 24 hours.
            </p>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-indigo-400 font-medium group-hover:translate-x-1 transition-transform">
              <span>Open Batch Chat</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Expiring / Key Important Links */}
          <div className="p-5 rounded-2xl glass-panel space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Important Links</h3>
              </div>
              <Link
                href="/links"
                className="text-xs text-zinc-400 hover:text-white transition-colors"
              >
                All Links
              </Link>
            </div>

            {expiringLinks.length > 0 && (
              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-xs text-amber-300">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Notice: Placement resume drop portal closes soon!</span>
              </div>
            )}

            <div className="space-y-2">
              {links.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => {
                    fetch("/api/links", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ id: link.id, action: "click" }),
                    });
                  }}
                  className="p-2.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/5 hover:border-white/15 transition-all flex items-center justify-between group"
                >
                  <div className="space-y-0.5 min-w-0 pr-2">
                    <div className="text-xs font-medium text-white group-hover:text-emerald-300 truncate">
                      {link.title}
                    </div>
                    <div className="text-[10px] font-mono text-zinc-400">
                      {link.category} • {link.click_count} clicks
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white shrink-0" />
                </a>
              ))}
            </div>
          </div>

          {/* Socials / Party Card */}
          <div className="p-5 rounded-2xl glass-panel space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-white">Batch Socials & Parties</h3>
              </div>
              <Link
                href="/party"
                className="text-xs text-zinc-400 hover:text-white transition-colors"
              >
                Explore
              </Link>
            </div>

            {partyEvents.length > 0 ? (
              partyEvents.map((evt) => (
                <Link
                  key={evt.id}
                  href="/party"
                  className="block p-3 rounded-xl bg-zinc-900/60 hover:bg-zinc-900 border border-white/5 hover:border-white/15 transition-all space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-amber-300">
                      {evt.category}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {evt.headcount.going} Going
                    </span>
                  </div>
                  <div className="text-xs font-medium text-white group-hover:text-amber-300 transition-colors">
                    {evt.title}
                  </div>
                  <div className="text-[11px] text-zinc-400 flex items-center justify-between">
                    <span>{evt.venue}</span>
                    <span className="font-mono text-zinc-400">
                      ₹{evt.budget_per_head}/head
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-xs text-zinc-500 py-3 text-center">
                No events currently scheduled. Plan one!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
