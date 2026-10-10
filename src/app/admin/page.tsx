"use client";

import { useEffect, useState } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  Users,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Plus,
  History,
} from "lucide-react";
import { ReportItem, AllowlistEntry, AuditLogEntry, UserProfile } from "@/types";

export default function AdminPage() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [allowlist, setAllowlist] = useState<AllowlistEntry[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<"reports" | "allowlist" | "audit">("reports");

  // New allowlist entry states
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newRoll, setNewRoll] = useState("");
  const [newRole, setNewRole] = useState("student");
  const [allowlistMsg, setAllowlistMsg] = useState("");

  const loadData = async () => {
    try {
      const [userRes, repRes, alRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/reports"),
        fetch("/api/admin/allowlist"),
      ]);
      const [userData, repData, alData] = await Promise.all([
        userRes.json(),
        repRes.json(),
        alRes.json(),
      ]);
      if (userData.user) setCurrentUser(userData.user);
      if (repData.reports) setReports(repData.reports);
      if (alData.allowlist) setAllowlist(alData.allowlist);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleResolveReport = async (reportId: string, action: "actioned" | "dismissed") => {
    await fetch("/api/reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ report_id: reportId, action }),
    });
    loadData();
  };

  const handleAddAllowlist = async (e: React.FormEvent) => {
    e.preventDefault();
    setAllowlistMsg("");
    try {
      const res = await fetch("/api/admin/allowlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newEmail,
          name: newName,
          roll_no: newRoll,
          role: newRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setAllowlistMsg("Student successfully added to allowlist.");
      setNewEmail("");
      setNewName("");
      setNewRoll("");
      loadData();
    } catch (err: any) {
      setAllowlistMsg(`Error: ${err.message}`);
    }
  };

  const isCRorAdmin = currentUser?.role === "cr" || currentUser?.role === "admin";

  if (!isCRorAdmin) {
    return (
      <div className="py-24 text-center glass-panel rounded-2xl max-w-lg mx-auto space-y-3">
        <ShieldCheck className="w-10 h-10 text-zinc-500 mx-auto" />
        <h2 className="text-base font-semibold text-white">Access Restricted</h2>
        <p className="text-xs text-zinc-400">
          This portal section is restricted to Class Representatives (CR) and Academic Office Administrators.
          You can test this persona via the persona switcher in the header.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-400" />
            CR & Academic Administration Hub
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Content moderation, batch member allowlist management, and system audit trails.
          </p>
        </div>

        <div className="px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-mono">
          Logged in as: {currentUser?.name} ({currentUser?.role?.toUpperCase()})
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-white/10 text-xs max-w-md">
        <button
          onClick={() => setActiveTab("reports")}
          className={`flex-1 py-1.5 rounded-lg transition-all ${
            activeTab === "reports"
              ? "bg-white/10 text-white font-medium"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Reports Queue ({reports.filter((r) => r.status === "pending").length})
        </button>
        <button
          onClick={() => setActiveTab("allowlist")}
          className={`flex-1 py-1.5 rounded-lg transition-all ${
            activeTab === "allowlist"
              ? "bg-white/10 text-white font-medium"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Batch Allowlist ({allowlist.length})
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`flex-1 py-1.5 rounded-lg transition-all ${
            activeTab === "audit"
              ? "bg-white/10 text-white font-medium"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Audit Logs
        </button>
      </div>

      {/* Reports Queue */}
      {activeTab === "reports" && (
        <div className="space-y-3">
          {reports.length > 0 ? (
            reports.map((rep) => (
              <div
                key={rep.id}
                className="p-5 rounded-2xl glass-panel flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase">
                      Target: {rep.target_type}
                    </span>
                    <span className="text-[11px] font-mono text-zinc-400">
                      Status: {rep.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-white">
                    Reason: &ldquo;{rep.reason}&rdquo;
                  </h3>
                  <div className="text-[10px] font-mono text-zinc-400">
                    Target ID: {rep.target_id} • Reported at {new Date(rep.created_at).toLocaleString()}
                  </div>
                </div>

                {rep.status === "pending" && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleResolveReport(rep.id, "actioned")}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium transition-colors"
                    >
                      Take Action (Hide/Mute)
                    </button>
                    <button
                      onClick={() => handleResolveReport(rep.id, "dismissed")}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="py-12 text-center rounded-2xl glass-panel space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <h4 className="text-sm font-medium text-white">Clean Queue</h4>
              <p className="text-xs text-zinc-400">
                No outstanding abuse or harassment reports reported by students.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Allowlist Management */}
      {activeTab === "allowlist" && (
        <div className="space-y-6">
          {/* Add Allowlist Member Form */}
          <div className="p-5 rounded-2xl glass-panel space-y-4">
            <h2 className="text-sm font-semibold text-white">
              Pre-Authorize Student or CR Roll Number
            </h2>
            {allowlistMsg && (
              <div className="text-xs p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300">
                {allowlistMsg}
              </div>
            )}
            <form onSubmit={handleAddAllowlist} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input
                type="text"
                required
                placeholder="Full Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none"
              />
              <input
                type="email"
                required
                placeholder="roll@iimrohtak.ac.in"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none"
              />
              <input
                type="text"
                required
                placeholder="Roll No (e.g. PGPX-001)"
                value={newRoll}
                onChange={(e) => setNewRoll(e.target.value)}
                className="px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors shadow-glow"
              >
                Add Member
              </button>
            </form>
          </div>

          {/* Current Allowlist Table */}
          <div className="p-5 rounded-2xl glass-panel space-y-3">
            <h2 className="text-sm font-semibold text-white">
              Pre-Authorized Batch Members ({allowlist.length})
            </h2>
            <div className="space-y-2">
              {allowlist.map((al) => (
                <div
                  key={al.id}
                  className="p-3 rounded-xl bg-zinc-900/60 border border-white/5 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-semibold text-white">{al.name}</span>
                    <span className="text-zinc-400 ml-2 font-mono">{al.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-zinc-400">{al.roll_no}</span>
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px] uppercase">
                      {al.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Audit Logs */}
      {activeTab === "audit" && (
        <div className="p-5 rounded-2xl glass-panel space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <History className="w-4 h-4 text-zinc-400" />
            <span>Portal Administrative Audit Log</span>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/5 text-xs flex items-center justify-between">
              <div>
                <span className="font-mono text-blue-400 font-semibold">[VERIFIED_DATE]</span>{" "}
                <span className="text-zinc-300">Class Representative verified assignment submission timeline</span>
              </div>
              <span className="text-zinc-500 font-mono text-[11px]">Recent</span>
            </div>
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/5 text-xs flex items-center justify-between">
              <div>
                <span className="font-mono text-emerald-400 font-semibold">[INITIALIZED]</span>{" "}
                <span className="text-zinc-300">Fresh portal database initialized for PGPx batch</span>
              </div>
              <span className="text-zinc-500 font-mono text-[11px]">System</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
