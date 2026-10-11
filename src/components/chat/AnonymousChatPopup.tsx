"use client";

import { useEffect, useState, useRef } from "react";
import { MessageSquare, Send, X, Clock } from "lucide-react";
import { ChatMessage } from "@/types";

export function AnonymousChatPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [myPseudonym, setMyPseudonym] = useState("Silent Falcon 42");
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadMessages = async () => {
    try {
      const res = await fetch(`/api/chat?_t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      const data = await res.json();
      if (data.currentUserPseudonym) setMyPseudonym(data.currentUserPseudonym);
      if (Array.isArray(data.messages)) {
        setMessages((prev) => {
          const map = new Map<string, ChatMessage>();
          const cutoff = Date.now() - 24 * 3600 * 1000;
          prev
            .filter((m) => new Date(m.created_at).getTime() >= cutoff)
            .forEach((m) => map.set(m.id, m));
          data.messages
            .filter((m: ChatMessage) => new Date(m.created_at).getTime() >= cutoff)
            .forEach((m: ChatMessage) => map.set(m.id, m));
          const merged = Array.from(map.values()).sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
          try {
            localStorage.setItem("pgpx_chat_cache", JSON.stringify(merged));
          } catch (e) {}
          return merged;
        });
      }
    } catch (err) {
      // silent
    }
  };

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
      // silent
    }
  };

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
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadMessages();
      const interval = setInterval(loadMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const text = inputText.trim();
    setSending(true);

    const optimisticMsg: ChatMessage = {
      id: `cmsg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      room_id: "batch-lounge",
      pseudonym: myPseudonym,
      body: text,
      created_at: new Date().toISOString(),
      is_own: true,
      reactions: {},
    };

    setMessages((prev) => {
      const next = [...prev, optimisticMsg];
      try {
        localStorage.setItem("pgpx_chat_cache", JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    setInputText("");
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, id: optimisticMsg.id }),
      });
      if (res.ok) {
        await loadMessages();
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    } catch (err) {
      // silent
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button in Bottom-Right */}
      <div className="fixed bottom-5 right-5 z-50">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white text-black hover:bg-[#eaeaea] font-medium text-xs shadow-xl transition-all active:scale-95 border border-[#e4e4e7]"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Anonymous Batch Chat</span>
            <span className="w-1.5 h-1.5 rounded-full bg-black" />
          </button>
        )}
      </div>

      {/* Floating Pop-up Window */}
      {isOpen && (
        <div className="fixed bottom-5 right-5 z-50 w-full max-w-sm sm:max-w-md h-[500px] rounded-xl bg-[#0a0a0c] border border-[#222226] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Header */}
          <div className="p-3 border-b border-[#1c1c20] flex items-center justify-between bg-[#0e0e11]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-[#18181b] border border-[#27272a] flex items-center justify-center text-white">
                <MessageSquare className="w-3 h-3" />
              </div>
              <div>
                <div className="text-xs font-medium text-white flex items-center gap-1.5">
                  <span>Anonymous Chat</span>
                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-[#161619] text-[#71717a] border border-[#242428]">
                    24h Purge
                  </span>
                </div>
                <div className="text-[10px] text-[#71717a] font-mono flex items-center gap-1.5 mt-0.5">
                  <span>Posting as:</span>
                  <span className="text-[#ededed] font-medium">{myPseudonym}</span>
                  <button
                    onClick={handleReroll}
                    type="button"
                    title="Change handle"
                    className="px-1 py-0.2 rounded bg-zinc-800 hover:bg-zinc-700 text-[9px] text-zinc-300 transition-colors"
                  >
                    🎲 Re-roll
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded text-[#71717a] hover:text-white hover:bg-[#18181b] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Ephemeral Info Banner */}
          <div className="px-3 py-1 bg-[#09090b] border-b border-[#18181b] text-[10px] text-[#52525b] flex items-center font-mono">
            <span>Text only • 24h rolling purge</span>
          </div>

          {/* Messages Stream (Text Only) */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-black">
            {messages.length > 0 ? (
              messages.map((m) => {
                const isOwn = m.pseudonym === myPseudonym;
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isOwn ? "items-end" : "items-start"} space-y-0.5`}
                  >
                    <div className="flex items-center gap-1.5 px-1 text-[10px] font-mono text-[#52525b]">
                      <span className={isOwn ? "text-[#a1a1aa] font-medium" : "text-[#71717a]"}>
                        {m.pseudonym}
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(m.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <div
                      className={`p-2 rounded-lg text-xs max-w-[85%] leading-relaxed ${
                        isOwn
                          ? "bg-white text-black font-normal"
                          : "bg-[#141416] text-[#ededed] border border-[#222226]"
                      }`}
                    >
                      {m.body}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#52525b] space-y-1.5">
                <Clock className="w-5 h-5 text-[#3f3f46]" />
                <p className="text-xs text-[#71717a]">No active messages in the last 24 hours.</p>
                <p className="text-[11px] text-[#52525b]">
                  Post anything anonymously to the batch.
                </p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <form
            onSubmit={handleSend}
            className="p-2 border-t border-[#1c1c20] bg-[#0c0c0e] flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Text anonymously as ${myPseudonym}...`}
              className="flex-1 bg-[#141416] border border-[#222226] px-2.5 py-1.5 rounded-lg text-xs text-white placeholder-[#52525b] focus:outline-none focus:border-[#38383f]"
            />
            <button
              type="submit"
              disabled={sending || !inputText.trim()}
              className="p-1.5 rounded-lg bg-white text-black hover:bg-[#eaeaea] disabled:opacity-30 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
