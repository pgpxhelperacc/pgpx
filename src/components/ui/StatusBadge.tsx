"use client";

import { ShieldCheck, CheckCircle2, Clock, AlertCircle } from "lucide-react";

interface StatusBadgeProps {
  type: "category" | "verification" | "progress" | "schedule";
  value: string;
}

export function StatusBadge({ type, value }: StatusBadgeProps) {
  if (type === "verification") {
    if (value === "verified") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-900 text-white border border-zinc-700">
          <ShieldCheck className="w-3 h-3 text-white" />
          <span>CR Verified</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-950 text-zinc-500 border border-zinc-800">
        <span>Community</span>
      </span>
    );
  }

  if (type === "progress") {
    if (value === "done") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-white text-black font-semibold">
          <CheckCircle2 className="w-3 h-3 text-black" />
          <span>Done</span>
        </span>
      );
    }
    if (value === "in_progress") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-900 text-zinc-300 border border-zinc-700">
          <Clock className="w-3 h-3 text-zinc-400" />
          <span>In Progress</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-950 text-zinc-500 border border-zinc-800">
        <span>Not Started</span>
      </span>
    );
  }

  if (type === "schedule") {
    if (value === "rescheduled") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-900 text-white border border-zinc-600">
          <AlertCircle className="w-3 h-3 text-white" />
          <span>Rescheduled</span>
        </span>
      );
    }
    if (value === "cancelled") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-950 text-zinc-500 border border-zinc-800 line-through">
          <span>Cancelled</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-900 text-zinc-400 border border-zinc-800">
        <span>Scheduled</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-900 text-zinc-300 border border-zinc-800">
      {value}
    </span>
  );
}
