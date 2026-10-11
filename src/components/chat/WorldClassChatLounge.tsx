"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Send,
  Clock,
  Smile,
  Reply,
  Copy,
  Check,
  Search,
  X,
  ChevronDown,
  Dices,
  Info,
  MessageSquare,
  ShieldAlert,
} from "lucide-react";
import { ChatMessage, ChatReplyTo } from "@/types";
import { supabaseBrowser } from "@/lib/supabase-client";
import { getAvatarColor, getAvatarInitials } from "@/lib/avatar";

const REACTION_EMOJIS = ["🔥", "👍", "😂", "🤫", "💀", "❤️", "💯"];

interface WorldClassChatLoungeProps {
  layoutMode?: "full" | "embedded" | "popup";
  className?: string;
  onClose?: () => void;
}

export function WorldClassChatLounge({
  layoutMode = "embedded",
  className = "",
  onClose,
}: WorldClassChatLoungeProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [myPseudonym, setMyPseudonym] = useState("Silent Member");
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [rerolling, setRerolling] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatReplyTo | null>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [showEmojiPickerFor, setShowEmojiPickerFor] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [reportSent, setReportSent] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Time formatting helpers
  const formatTimeAgo = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);

    if (diffSec < 45) return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    return "today";
  };

  const formatRemainingTime = (isoString: string) => {
    const elapsedMs = Date.now() - new Date(isoString).getTime();
    const remainingMs = Math.max(0, 24 * 3600 * 1000 - elapsedMs);
    const remainingHr = Math.floor(remainingMs / 3600000);
    const remainingMin = Math.floor((remainingMs % 3600000) / 60000);

    if (remainingHr >= 1) return `${remainingHr}h left`;
    return `${remainingMin}m left`;
  };

  // Helper to deduplicate & merge messages
  const mergeMessages = useCallback((prev: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] => {
    const map = new Map<string, ChatMessage>();
    const cutoff = Date.now() - 24 * 3600 * 1000;

    prev.filter((m) => new Date(m.created_at).getTime() >= cutoff).forEach((m) => map.set(m.id, m));
    incoming.filter((m) => new Date(m.created_at).getTime() >= cutoff).forEach((m) => map.set(m.id, m));

    const merged = Array.from(map.values()).sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    try {
      localStorage.setItem("pgpx_chat_cache", JSON.stringify(merged));
    } catch (e) {}

    return merged;
  }, []);

  // Fetch messages from server
  const loadMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/chat?_t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      const data = await res.json();
      if (data.currentUserPseudonym) {
        setMyPseudonym(data.currentUserPseudonym);
      }
      if (Array.isArray(data.messages)) {
        setMessages((prev) => mergeMessages(prev, data.messages));
      }
    } catch (err) {
      // silent
    }
  }, [mergeMessages]);

  // Initial load from local cache + server
  useEffect(() => {
    try {
      const cached = localStorage.getItem("pgpx_chat_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        const cutoff = Date.now() - 24 * 3600 * 1000;
        if (Array.isArray(parsed)) {
          setMessages(parsed.filter((m: ChatMessage) => new Date(m.created_at).getTime() >= cutoff));
        }
      }
    } catch (e) {}

    loadMessages();

    // Secondary fallback polling (every 3 seconds)
    const interval = setInterval(loadMessages, 3000);

    // Primary real-time sync via Supabase WebSocket
    const channel = supabaseBrowser
      .channel("realtime:pgpx_chat_lounge")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pgpx_chat_messages" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const row: any = payload.new;
            const newMsg: ChatMessage = {
              id: row.id,
              room_id: row.room_id || "batch-lounge",
              pseudonym: row.pseudonym,
              body: row.body,
              created_at: row.created_at,
              reply_to: row.reply_to || null,
              reactions: typeof row.reactions === "object" ? row.reactions : {},
            };
            setMessages((prev) => mergeMessages(prev, [newMsg]));
            setTimeout(() => {
              if (!showScrollBottom) {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
              }
            }, 60);
          } else if (payload.eventType === "UPDATE") {
            const row: any = payload.new;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === row.id
                  ? {
                      ...m,
                      body: row.body,
                      reactions: typeof row.reactions === "object" ? row.reactions : m.reactions,
                      reply_to: row.reply_to !== undefined ? row.reply_to : m.reply_to,
                    }
                  : m
              )
            );
          } else if (payload.eventType === "DELETE") {
            const oldId = (payload.old as any)?.id;
            if (oldId) {
              setMessages((prev) => prev.filter((m) => m.id !== oldId));
            }
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabaseBrowser.removeChannel(channel);
    };
  }, [loadMessages, mergeMessages, showScrollBottom]);

  // Handle scroll detection for "New messages" pill
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 120;
    setShowScrollBottom(!isNearBottom);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowScrollBottom(false);
  };

  // Re-roll pseudonym
  const handleReroll = async () => {
    setRerolling(true);
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
    } finally {
      setRerolling(false);
    }
  };

  // Send message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;

    const text = inputText.trim();
    const replyTarget = replyingTo;
    const clientMsgId = `cmsg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    setSending(true);

    const optimisticMsg: ChatMessage = {
      id: clientMsgId,
      room_id: "batch-lounge",
      pseudonym: myPseudonym,
      body: text,
      created_at: new Date().toISOString(),
      reactions: {},
      user_reactions: [],
      reply_to: replyTarget,
      is_own: true,
    };

    setMessages((prev) => mergeMessages(prev, [optimisticMsg]));
    setInputText("");
    setReplyingTo(null);

    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          id: clientMsgId,
          reply_to: replyTarget,
        }),
      });

      if (res.ok) {
        await loadMessages();
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  // Toggle reaction
  const handleReact = async (messageId: string, emoji: string) => {
    setShowEmojiPickerFor(null);

    // Optimistic toggle
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;

        const currentCounts = { ...(m.reactions || {}) };
        const currentUserReactions = [...(m.user_reactions || [])];
        const hasReacted = currentUserReactions.includes(emoji);

        if (hasReacted) {
          const newCount = (currentCounts[emoji] || 1) - 1;
          if (newCount <= 0) delete currentCounts[emoji];
          else currentCounts[emoji] = newCount;
          const idx = currentUserReactions.indexOf(emoji);
          currentUserReactions.splice(idx, 1);
        } else {
          currentCounts[emoji] = (currentCounts[emoji] || 0) + 1;
          currentUserReactions.push(emoji);
        }

        return {
          ...m,
          reactions: currentCounts,
          user_reactions: currentUserReactions,
        };
      })
    );

    try {
      await fetch("/api/chat", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, emoji }),
      });
      loadMessages();
    } catch (err) {
      // silent
    }
  };

  // Copy message text
  const handleCopy = (msg: ChatMessage) => {
    navigator.clipboard.writeText(msg.body);
    setCopiedId(msg.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Submit report to CR
  const handleReport = async (messageId: string) => {
    try {
      await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_type: "chat_message",
          target_id: messageId,
          reason: "Inappropriate anonymous chat message flagged by batch member",
        }),
      });
      setReportSent(true);
      setTimeout(() => {
        setActiveReportId(null);
        setReportSent(false);
      }, 1500);
    } catch (e) {}
  };

  // Filter messages by search query
  const filteredMessages = messages.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return m.body.toLowerCase().includes(q) || m.pseudonym.toLowerCase().includes(q);
  });

  return (
    <div
      className={`flex flex-col bg-[#050506] border border-white/[0.08] text-[#ededed] font-sans overflow-hidden select-text ${
        layoutMode === "popup"
          ? "h-full rounded-2xl shadow-2xl"
          : layoutMode === "full"
          ? "h-[calc(100vh-8.5rem)] rounded-2xl shadow-xl"
          : "h-[540px] rounded-2xl shadow-lg"
      } ${className}`}
    >
      {/* ============================================================ */}
      {/* 1. HEADER: BRANDING, LIVE STATUS, PSEUDONYM & SEARCH */}
      {/* ============================================================ */}
      <div className="px-4 py-3 bg-[#0a0a0c] border-b border-white/[0.06] flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="absolute w-4 h-4 rounded-full bg-emerald-500/20 animate-ping" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white tracking-tight">
                Anonymous Batch Lounge
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/[0.06] text-zinc-400 border border-white/[0.06]">
                <Clock className="w-2.5 h-2.5 text-zinc-400" />
                24h Ephemeral
              </span>
            </div>
            <div className="text-[10px] text-zinc-500 truncate flex items-center gap-1">
              <span>Encrypted & unlinked</span>
              <span>•</span>
              <span className="text-zinc-400">All chats vanish in 24 hours</span>
            </div>
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Search Toggle */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`p-1.5 rounded-lg border text-xs transition-colors ${
              showSearch
                ? "bg-white/10 text-white border-white/20"
                : "bg-white/[0.03] text-zinc-400 border-white/[0.06] hover:text-white hover:bg-white/[0.06]"
            }`}
            title="Search 24h messages"
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          {/* Persona Card & Reroll */}
          <div className="flex items-center gap-1.5 bg-[#121215] border border-white/[0.08] px-2.5 py-1 rounded-xl">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold border ${
                getAvatarColor(myPseudonym).bg
              } ${getAvatarColor(myPseudonym).text} ${getAvatarColor(myPseudonym).border}`}
            >
              {getAvatarInitials(myPseudonym)}
            </div>

            <div className="text-[11px] font-medium text-zinc-200 hidden md:block max-w-[110px] truncate">
              {myPseudonym}
            </div>

            <button
              onClick={handleReroll}
              disabled={rerolling}
              className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40"
              title="Re-roll identity"
            >
              <Dices className={`w-3.5 h-3.5 ${rerolling ? "animate-spin text-white" : ""}`} />
            </button>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Expandable Search Input */}
      {showSearch && (
        <div className="px-3 py-2 bg-[#0d0d10] border-b border-white/[0.06] flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
          <Search className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search active messages or pseudonyms..."
            className="flex-1 bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-zinc-500 hover:text-zinc-300 text-xs px-1"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* Ephemeral Guarantee Strip */}
      <div className="px-4 py-1.5 bg-[#08080a] border-b border-white/[0.04] text-[10px] font-mono text-zinc-500 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Info className="w-3 h-3 text-zinc-500" />
          <span>Messages strictly auto-delete after 24h</span>
        </span>
        <span className="text-zinc-600 hidden sm:inline">
          {filteredMessages.length} active {filteredMessages.length === 1 ? "chat" : "chats"}
        </span>
      </div>

      {/* ============================================================ */}
      {/* 2. CHAT STREAM CONTAINER */}
      {/* ============================================================ */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#050507] scroll-smooth"
      >
        {filteredMessages.length > 0 ? (
          filteredMessages.map((msg) => {
            const isOwn = msg.pseudonym === myPseudonym;
            const timeAgo = formatTimeAgo(msg.created_at);
            const timeLeft = formatRemainingTime(msg.created_at);
            const avatar = getAvatarColor(msg.pseudonym);
            const isHovered = hoveredMessageId === msg.id;

            return (
              <div
                key={msg.id}
                onMouseEnter={() => setHoveredMessageId(msg.id)}
                onMouseLeave={() => {
                  setHoveredMessageId(null);
                  if (showEmojiPickerFor === msg.id) setShowEmojiPickerFor(null);
                }}
                className={`flex flex-col ${isOwn ? "items-end" : "items-start"} space-y-1 relative group`}
              >
                {/* Message Header: Avatar, Pseudonym, Relative Time & Expiry Pill */}
                <div className="flex items-center gap-2 px-1 text-[10px] font-mono text-zinc-500">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold border ${avatar.bg} ${avatar.text} ${avatar.border}`}
                  >
                    {getAvatarInitials(msg.pseudonym)}
                  </div>
                  <span className={isOwn ? "text-zinc-300 font-semibold" : "text-zinc-400"}>
                    {msg.pseudonym}
                  </span>
                  <span>•</span>
                  <span>{timeAgo}</span>
                  <span>•</span>
                  <span className="text-zinc-500 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5 text-zinc-600" />
                    <span>{timeLeft}</span>
                  </span>
                </div>

                {/* Quoted Reply Preview (if replying to another message) */}
                {msg.reply_to && (
                  <div
                    className={`text-[11px] font-mono px-3 py-1 rounded-t-xl border border-b-0 max-w-[85%] text-zinc-400 flex items-center gap-1.5 ${
                      isOwn
                        ? "bg-zinc-800/80 border-white/10 text-zinc-300"
                        : "bg-white/[0.03] border-white/[0.06] text-zinc-400"
                    }`}
                  >
                    <Reply className="w-3 h-3 text-zinc-500 shrink-0" />
                    <span className="font-medium text-zinc-300 truncate max-w-[100px]">
                      {msg.reply_to.pseudonym}:
                    </span>
                    <span className="truncate italic">
                      {msg.reply_to.body}
                    </span>
                  </div>
                )}

                {/* Message Body Bubble */}
                <div className="relative max-w-[88%] sm:max-w-[80%]">
                  <div
                    className={`p-3.5 rounded-2xl text-xs sm:text-[13px] leading-relaxed transition-all break-words ${
                      isOwn
                        ? "bg-white text-black font-normal rounded-tr-sm shadow-md"
                        : "bg-[#111114] text-zinc-200 border border-white/[0.08] rounded-tl-sm hover:border-white/[0.14]"
                    }`}
                  >
                    {msg.body}
                  </div>

                  {/* Floating Action Bar on Hover */}
                  {isHovered && (
                    <div
                      className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1 bg-[#18181b] border border-white/10 px-1.5 py-1 rounded-xl shadow-xl z-10 transition-all ${
                        isOwn ? "-left-28" : "-right-28"
                      }`}
                    >
                      {/* React Button */}
                      <button
                        onClick={() =>
                          setShowEmojiPickerFor(showEmojiPickerFor === msg.id ? null : msg.id)
                        }
                        className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                        title="React with emoji"
                      >
                        <Smile className="w-3.5 h-3.5" />
                      </button>

                      {/* Reply Button */}
                      <button
                        onClick={() => {
                          setReplyingTo({
                            id: msg.id,
                            pseudonym: msg.pseudonym,
                            body: msg.body.length > 60 ? `${msg.body.slice(0, 60)}...` : msg.body,
                          });
                          inputRef.current?.focus();
                        }}
                        className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                        title="Reply to message"
                      >
                        <Reply className="w-3.5 h-3.5" />
                      </button>

                      {/* Copy Button */}
                      <button
                        onClick={() => handleCopy(msg)}
                        className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                        title="Copy text"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Report to CR (for others' messages) */}
                      {!isOwn && (
                        <button
                          onClick={() => setActiveReportId(msg.id)}
                          className="p-1 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-white/10 transition-colors"
                          title="Report message"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Floating Quick Emoji Picker */}
                  {showEmojiPickerFor === msg.id && (
                    <div
                      className={`absolute -top-10 flex items-center gap-1 bg-[#1c1c20] border border-white/15 p-1 rounded-2xl shadow-2xl z-20 animate-in fade-in zoom-in-95 ${
                        isOwn ? "right-0" : "left-0"
                      }`}
                    >
                      {REACTION_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleReact(msg.id, emoji)}
                          className="p-1 text-sm rounded-lg hover:bg-white/10 hover:scale-125 transition-transform"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Reaction Badges Below Message */}
                {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5 px-1">
                    {Object.entries(msg.reactions).map(([emoji, count]) => {
                      if (count <= 0) return null;
                      const hasReacted = msg.user_reactions?.includes(emoji);

                      return (
                        <button
                          key={emoji}
                          onClick={() => handleReact(msg.id, emoji)}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono border transition-all active:scale-95 ${
                            hasReacted
                              ? "bg-white/15 text-white border-white/30 font-semibold"
                              : "bg-white/[0.03] text-zinc-400 border-white/[0.08] hover:border-white/20 hover:text-zinc-200"
                          }`}
                        >
                          <span>{emoji}</span>
                          <span className="text-[10px]">{count}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-zinc-500 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-400 shadow-inner">
              <MessageSquare className="w-6 h-6 text-zinc-300" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-zinc-200">
                {searchQuery ? "No matching chats found" : "Welcome to the PGPx Anonymous Lounge"}
              </p>
              <p className="text-xs text-zinc-500 max-w-sm leading-relaxed">
                {searchQuery
                  ? "Try searching for another keyword or pseudonym."
                  : "Zero tracking, zero names, zero roll numbers. Speak freely with the batch. Everything automatically disappears after 24 hours."}
              </p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating "Scroll to Bottom" Pill */}
      {showScrollBottom && (
        <div className="relative">
          <button
            onClick={scrollToBottom}
            className="absolute -top-11 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-black text-[11px] font-medium shadow-xl hover:bg-zinc-200 transition-all active:scale-95 z-30"
          >
            <span>New messages</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. INPUT COMPONENT WITH ACTIVE REPLY CONTEXT */}
      {/* ============================================================ */}
      <div className="border-t border-white/[0.06] bg-[#09090b] p-3 space-y-2 shrink-0">
        {/* Reply Context Banner */}
        {replyingTo && (
          <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs">
            <div className="flex items-center gap-2 text-zinc-400 min-w-0">
              <Reply className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="text-zinc-300 font-medium truncate">
                Replying to {replyingTo.pseudonym}:
              </span>
              <span className="italic truncate text-zinc-500 max-w-[200px]">
                "{replyingTo.body}"
              </span>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="p-1 rounded text-zinc-500 hover:text-zinc-200 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Message anonymously as ${myPseudonym}...`}
            maxLength={1000}
            className="flex-1 bg-[#121215] border border-white/[0.08] px-3.5 py-2.5 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 transition-colors"
          />

          <button
            type="submit"
            disabled={sending || !inputText.trim()}
            className="px-4 py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 font-medium text-xs flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none shrink-0"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* Confirmation Modal for Reporting Message */}
      {activeReportId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-white/10 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-rose-400 text-sm font-semibold">
              <ShieldAlert className="w-4 h-4" />
              <span>Report to Batch CR</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Flag this message for constructive community review. Anonymity is preserved; no student identities are revealed.
            </p>
            {reportSent ? (
              <div className="text-xs text-emerald-400 font-medium py-2">
                ✓ Report submitted to CR dashboard.
              </div>
            ) : (
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setActiveReportId(null)}
                  className="px-3 py-1.5 rounded-xl text-xs text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReport(activeReportId)}
                  className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium"
                >
                  Confirm Report
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
