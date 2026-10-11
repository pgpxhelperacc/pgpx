// Deterministic geometric avatar generator for anonymous pseudonyms
export function getAvatarColor(pseudonym: string): { bg: string; text: string; border: string; accent: string } {
  let hash = 0;
  for (let i = 0; i < pseudonym.length; i++) {
    hash = (hash << 5) - hash + pseudonym.charCodeAt(i);
    hash |= 0;
  }
  const abs = Math.abs(hash);
  const palettes = [
    { bg: "bg-zinc-900", text: "text-zinc-200", border: "border-zinc-700", accent: "#71717a" },
    { bg: "bg-neutral-900", text: "text-neutral-200", border: "border-neutral-700", accent: "#a3a3a3" },
    { bg: "bg-stone-900", text: "text-stone-200", border: "border-stone-700", accent: "#a8a29e" },
    { bg: "bg-zinc-800", text: "text-zinc-100", border: "border-zinc-600", accent: "#d4d4d8" },
    { bg: "bg-zinc-950", text: "text-white", border: "border-zinc-800", accent: "#e4e4e7" },
  ];
  return palettes[abs % palettes.length];
}

export function getAvatarInitials(pseudonym: string): string {
  if (!pseudonym) return "P";
  const parts = pseudonym.trim().split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return pseudonym.slice(0, 2).toUpperCase();
}
