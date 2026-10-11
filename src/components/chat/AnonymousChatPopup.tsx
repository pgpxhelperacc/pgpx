"use client";

import React, { useState } from "react";
import { MessageSquare } from "lucide-react";
import { WorldClassChatLounge } from "./WorldClassChatLounge";

export function AnonymousChatPopup() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-5 right-5 z-50 select-none">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white text-black hover:bg-[#eaeaea] font-medium text-xs shadow-2xl transition-all active:scale-95 border border-[#e4e4e7]"
        >
          <div className="relative">
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <span>Anonymous Batch Chat</span>
          <span className="w-1.5 h-1.5 rounded-full bg-black" />
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-x-3 bottom-3 sm:inset-auto sm:bottom-5 sm:right-5 w-auto sm:w-[420px] h-[550px] z-50">
          <WorldClassChatLounge
            layoutMode="popup"
            onClose={() => setIsOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
