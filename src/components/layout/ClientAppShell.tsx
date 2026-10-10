"use client";

import { ReactNode, useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { AddReminderModal } from "@/components/reminders/AddReminderModal";
import { AnonymousChatPopup } from "@/components/chat/AnonymousChatPopup";
import { UserProfile } from "@/types";

export function ClientAppShell({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile>({
    id: "u-batch",
    email: "student@iimrohtak.ac.in",
    name: "PGPx Student",
    roll_no: "PGPx",
    role: "student",
    batch: "PGPx",
    term: "",
    section: "A",
  });

  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [addReminderOpen, setAddReminderOpen] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.user) setCurrentUser(data.user);
        }
      } catch (err) {
        // use fallback
      }
    }
    loadUser();
  }, []);

  return (
    <div className="flex w-full min-h-screen bg-black text-[#ededed] antialiased">
      {/* Desktop Sidebar */}
      <Sidebar userRole={currentUser.role} />

      {/* Main Body */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-6">
        <Header
          currentUser={currentUser}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          onOpenAddReminder={() => setAddReminderOpen(true)}
        />

        <main className="flex-1 px-4 sm:px-6 py-6 max-w-7xl w-full mx-auto animate-in fade-in duration-200">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav />

      {/* Interactive Command Palette (Cmd+K) */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onOpenAddReminder={() => setAddReminderOpen(true)}
      />

      {/* Quick Add Reminder Modal */}
      <AddReminderModal
        isOpen={addReminderOpen}
        onClose={() => setAddReminderOpen(false)}
        onReminderAdded={() => {
          // trigger reload or re-fetch on the active page
          if (window.location.pathname === "/" || window.location.pathname === "/reminders") {
            window.location.reload();
          }
        }}
      />
      {/* Floating Anonymous Group Chat Pop-up (Bottom-Right) */}
      <AnonymousChatPopup />
    </div>
  );
}
