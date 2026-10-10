"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface CountdownTimerProps {
  targetDate: string;
  label?: string;
  variant?: "pill" | "badge" | "compact";
}

export function CountdownTimer({
  targetDate,
  label,
  variant = "pill",
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isPast: boolean;
    totalHours: number;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isPast: false,
    totalHours: 0,
  });

  useEffect(() => {
    function calculate() {
      const now = Date.now();
      const target = new Date(targetDate).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isPast: true,
          totalHours: 0,
        });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      const totalHours = diff / (1000 * 60 * 60);

      setTimeLeft({ days, hours, minutes, seconds, isPast: false, totalHours });
    }

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (timeLeft.isPast) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-zinc-800 text-zinc-400 border border-white/5">
        Past Due
      </span>
    );
  }

  // Determine urgency color
  let colorClasses = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  if (timeLeft.totalHours < 12) {
    colorClasses = "bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse";
  } else if (timeLeft.totalHours < 48) {
    colorClasses = "bg-amber-500/10 text-amber-400 border-amber-500/20";
  }

  const formatText = () => {
    if (timeLeft.days > 0) {
      return `${timeLeft.days}d ${timeLeft.hours}h`;
    }
    if (timeLeft.hours > 0) {
      return `${timeLeft.hours}h ${timeLeft.minutes}m`;
    }
    return `${timeLeft.minutes}m ${timeLeft.seconds}s`;
  };

  if (variant === "compact") {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono border ${colorClasses}`}>
        <Clock className="w-3 h-3" />
        <span>{formatText()}</span>
      </span>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono border ${colorClasses}`}>
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
      </span>
      {label && <span className="text-[11px] font-sans text-zinc-300 mr-0.5">{label}</span>}
      <span>{formatText()}</span>
    </div>
  );
}
