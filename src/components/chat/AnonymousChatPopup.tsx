"use client";

import { useEffect, useState, useRef } from "react";
import { MessageSquare, Send, X, Clock, Shield } from "lucide-react";
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
      const res = await fetch("/api/chat");
      const data = await res.json();
      if (data.messages) setMessages(data.messages);
      if (data.currentUserPseudonym) setMyPseudonym(data.currentUserPseudonym);
    } catch (err) {
      // silent
    }
  };

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
      // silent
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Floating Button in Bottom-Right */}
      <div className="fixed bottom-5 right-5 z-50">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white text-black hover:bg-zinc-200 font-medium text-xs shadow-2xl transition-all active:scale-95 border border-zinc-200"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Anonymous Batch Chat</span>
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
          </button>
        )}
      </div>

      {/* Floating Pop-up Window */}
      {isOpen && (
        <div className="fixed bottom-5 right-5 z-50 w-full max-w-sm sm:max-w-md h-[520px] rounded-2xl bg-black border border-zinc-800 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-3.5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white">
                <MessageSquare className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <span>Anonymous Chat</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                    24h Purge
                  </span>
                </div>
                <div className="text-[10px] text-zinc-400 font-mono">
                  Posting as: <span className="text-white font-medium">{myPseudonym}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Ephemeral Info Banner */}
          <div className="px-3 py-1.5 bg-zinc-950 border-b border-zinc-900 text-[10px] text-zinc-500 flex items-center justify-between">
            <span>Text only • Hard-deleted every 24 hours</span>
            <span>@iimrohtak.ac.in</span>
          </div>

          {/* Messages Stream (Text Only) */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-black">
            {messages.length > 0 ? (
              messages.map((m) => {
                const isOwn = m.pseudonym === myPseudonym;
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isOwn ? "items-end" : "items-start"} space-y-0.5`}
                  >
                    <div className="flex items-center gap-1.5 px-1 text-[10px] font-mono text-zinc-500">
                      <span className={isOwn ? "text-zinc-300 font-medium" : "text-zinc-500"}>
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
                      className={`p-2.5 rounded-xl text-xs max-w-[85%] leading-relaxed ${
                        isOwn
                          ? "bg-white text-black"
                          : "bg-zinc-900 text-zinc-200 border border-zinc-800"
                      }`}
                    >
                      {m.body}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500 space-y-2">
                <Clock className="w-6 h-6 text-zinc-600" />
                <p className="text-xs text-zinc-400">No active messages in the last 24h.</p>
                <p className="text-[11px] text-zinc-600">
                  Be the first to post anonymously to the batch!
                </p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <form
            onSubmit={handleSend}
            className="p-2.5 border-t border-zinc-800 bg-zinc-950 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Text anonymously as ${myPseudonym}...`}
              className="flex-1 bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
            />
            <button
              type="submit"
              disabled={sending || !inputText.trim()}
              className="p-2 rounded-xl bg-white text-black hover:bg-zinc-200 disabled:opacity-40 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
