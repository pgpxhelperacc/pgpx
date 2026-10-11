"use client";

import { useEffect, useState, useRef } from "react";
import {
  MessageSquare,
  Send,
  Sparkles,
  ShieldAlert,
  Clock,
  Flag,
  Smile,
  Info,
  Check,
} from "lucide-react";
import { ChatMessage } from "@/types";
import { Modal } from "@/components/ui/Modal";

export default function AnonymousChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [myPseudonym, setMyPseudonym] = useState("Silent Falcon 42");
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportedMessageId, setReportedMessageId] = useState("");
  const [reportReason, setReportReason] = useState("");
  const [reportSuccess, setReportSuccess] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadMessages = async () => {
    try {
      const res = await fetch("/api/chat");
      const data = await res.json();
      if (data.messages) setMessages(data.messages);
      if (data.currentUserPseudonym) setMyPseudonym(data.currentUserPseudonym);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 4000); // polling updates
    return () => clearInterval(interval);
  }, []);

  const handleReroll = async () => {
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reroll: true }),
      });
      const data = await res.json();
      if (data.currentUserPseudonym) {
        setMyPseudonym(data.currentUserPseudonym);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: inputText }),
      });

      if (res.ok) {
        setInputText("");
        loadMessages();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId, emoji }),
    });
    loadMessages();
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        target_type: "chat_message",
        target_id: reportedMessageId,
        reason: reportReason || "Inappropriate message reported by student",
      }),
    });
    setReportSuccess(true);
    setTimeout(() => {
      setReportModalOpen(false);
      setReportSuccess(false);
      setReportReason("");
    }, 1500);
  };

  const availableEmojis = ["👍", "🔥", "❤️", "👀", "🙏"];

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] max-w-5xl mx-auto space-y-3">
      {/* 24-Hour Purge & Ephemeral Banner */}
      <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-zinc-950 to-purple-950/40 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-white flex items-center gap-2">
              <span>Anonymous Batch Lounge</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                24h Ephemeral
              </span>
            </div>
            <div className="text-[11px] text-zinc-400">
              Messages vanish permanently after 24 hours. Your pseudonym rotates daily.
            </div>
          </div>
        </div>

        {/* Current Pseudonym Pill */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-white/10 text-xs font-mono text-zinc-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-zinc-500">Your Pseudonym:</span>
            <span className="text-white font-semibold">{myPseudonym}</span>
            <button
              onClick={handleReroll}
              type="button"
              className="ml-1 px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] text-zinc-200 transition-colors"
            >
              🎲 Re-roll
            </button>
          </div>
        </div>
      </div>

      {/* Screenshot / Community Rules Notice */}
      <div className="px-4 py-2 rounded-xl bg-zinc-950 border border-white/5 flex items-center text-[11px] text-zinc-400 shrink-0">
        <span className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-zinc-400" />
          <span>Note: Anonymity cannot prevent device screenshots. Maintain institute community rules.</span>
        </span>
      </div>

      {/* Chat Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 rounded-2xl glass-panel space-y-4">
        {messages.map((msg) => {
          const isOwn = msg.pseudonym === myPseudonym;
          const timeFormatted = new Date(msg.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isOwn ? "items-end" : "items-start"} space-y-1 group`}
            >
              <div className="flex items-center gap-2 px-1">
                <span className={`text-[11px] font-mono font-medium ${isOwn ? "text-blue-400" : "text-zinc-400"}`}>
                  {msg.pseudonym}
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {timeFormatted}
                </span>
                {!isOwn && (
                  <button
                    onClick={() => {
                      setReportedMessageId(msg.id);
                      setReportModalOpen(true);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-zinc-400 hover:text-rose-400 transition-opacity"
                    title="Report message to CR"
                  >
                    <Flag className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-md sm:max-w-lg p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                  isOwn
                    ? "bg-blue-600 text-white rounded-tr-none shadow-glow"
                    : "bg-zinc-900 text-zinc-200 border border-white/5 rounded-tl-none"
                }`}
              >
                {msg.body}
              </div>

              {/* Reactions Bar */}
              <div className="flex items-center gap-1 px-1">
                {Object.entries(msg.reactions || {}).map(([emoji, count]) => (
                  <button
                    key={emoji}
                    onClick={() => handleReaction(msg.id, emoji)}
                    className="px-1.5 py-0.5 rounded-full bg-zinc-900 border border-white/5 hover:border-white/20 text-[10px] text-zinc-300 flex items-center gap-1 transition-colors"
                  >
                    <span>{emoji}</span>
                    <span className="font-mono">{count}</span>
                  </button>
                ))}

                {/* Add Reaction Triggers */}
                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 ml-1 transition-opacity">
                  {availableEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleReaction(msg.id, emoji)}
                      className="p-1 rounded hover:bg-zinc-800 text-[11px] transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Box */}
      <form
        onSubmit={handleSendMessage}
        className="flex items-center gap-2 p-2 rounded-2xl bg-zinc-950 border border-white/10 shrink-0"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Speak anonymously as ${myPseudonym}...`}
          className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={sending || !inputText.trim()}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-glow transition-all active:scale-95 disabled:opacity-50"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* Report Modal */}
      <Modal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        title="Report Message to CR / Admin"
        description="Help maintain a constructive, respectful batch environment. CRs can delete abusive messages."
      >
        <form onSubmit={handleReportSubmit} className="space-y-4">
          {reportSuccess ? (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Report filed successfully. Thank you for keeping the portal safe.</span>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Reason for reporting *
                </label>
                <textarea
                  required
                  rows={3}
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Harassment, profanity, inappropriate conduct, or policy violation..."
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setReportModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs transition-colors"
                >
                  Submit Report
                </button>
              </div>
            </>
          )}
        </form>
      </Modal>
    </div>
  );
}
