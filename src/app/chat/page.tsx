"use client";

import React from "react";
import { WorldClassChatLounge } from "@/components/chat/WorldClassChatLounge";

export default function ChatPage() {
  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-8rem)]">
      <WorldClassChatLounge layoutMode="full" className="h-full" />
    </div>
  );
}
