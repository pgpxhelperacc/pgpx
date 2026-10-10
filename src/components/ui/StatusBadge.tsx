"use client";

import { ShieldCheck, AlertCircle, CheckCircle2, Clock } from "lucide-react";

interface StatusBadgeProps {
  type: "category" | "verification" | "progress" | "schedule";
  value: string;
}

export function StatusBadge({ type, value }: StatusBadgeProps) {
  if (type === "verification") {
    if (value === "verified") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-sm">
          <ShieldCheck className="w-3 h-3 text-blue-400" />
          <span>CR Verified</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-800 text-zinc-400 border border-white/5">
        <span>Community</span>
      </span>
    );
  }

  if (type === "progress") {
    if (value === "done") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3 h-3" />
          <span>Done</span>
        </span>
      );
    }
    if (value === "in_progress") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <Clock className="w-3 h-3" />
          <span>In Progress</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono bg-zinc-800 text-zinc-400 border border-white/5">
        <span>Not Started</span>
      </span>
    );
  }

  if (type === "schedule") {
    if (value === "rescheduled") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30 animate-pulse">
          <AlertCircle className="w-3 h-3" />
          <span>Rescheduled</span>
        </span>
      );
    }
    if (value === "cancelled") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/15 text-rose-300 border border-rose-500/30">
          <span>Cancelled</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-300 border border-white/5">
        <span>Scheduled</span>
      </span>
    );
  }

  // Category badges
  const categoryColors: Record<string, string> = {
    Quiz: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    Exam: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    Assignment: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    Submission: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    Event: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    Holiday: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    Tools: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    Placement: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    Admin: "bg-zinc-800 text-zinc-300 border-zinc-700",
  };

  const style = categoryColors[value] || "bg-zinc-800 text-zinc-400 border-white/5";

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono border ${style}`}>
      {value}
    </span>
  );
}
