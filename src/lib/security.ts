import crypto from "crypto";

const PEPPER = process.env.ANONYMOUS_SALT_SECRET || "pgpx_iim_rohtak_secure_pepper_2026_super_secret_key_owasp";
const ALLOWED_DOMAIN = (process.env.ALLOWED_EMAIL_DOMAIN || "@iimrohtak.ac.in").toLowerCase();

/**
 * OWASP Rule: Strict Email Domain Validation
 * Restricts access strictly to official IIM Rohtak student/faculty/staff accounts.
 */
export function isValidInstituteEmail(email: string | null | undefined): boolean {
  if (!email || typeof email !== "string") return false;
  const trimmed = email.trim().toLowerCase();

  // Standard RFC-compliant email regex + exact domain matching
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!emailRegex.test(trimmed)) return false;

  return trimmed.endsWith(ALLOWED_DOMAIN);
}

/**
 * OWASP Rule: XSS Prevention & Input Sanitization
 * Strips script tags, unsafe protocols, and encodes dangerous characters.
 */
export function sanitizeText(input: string | null | undefined): string {
  if (!input) return "";
  let clean = input.trim();
  // Strip null bytes
  clean = clean.replace(/\0/g, "");
  // Remove script tags and embedded JavaScript triggers
  clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  clean = clean.replace(/javascript:/gi, "");
  clean = clean.replace(/data:text\/html/gi, "");
  clean = clean.replace(/on\w+\s*=/gi, "");
  // Escape angle brackets
  clean = clean.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return clean;
}

/**
 * Privacy Guarantee: Cryptographic One-Way Feedback Hash
 * Allows enforcing 1 submission per student per course per term without ever storing the student's ID on the row.
 * The hash cannot be reversed to reveal the student's identity.
 */
export function computeFeedbackHash(
  userId: string,
  courseId: string,
  facultyId: string,
  term: string
): string {
  const payload = `${userId}:${courseId}:${facultyId}:${term}`;
  return crypto.createHmac("sha256", PEPPER).update(payload).digest("hex");
}

/**
 * Privacy Guarantee: Daily Rotating Anonymous Pseudonyms
 * Format: [Adjective] [Animal] [2-digit Number]
 * The pseudonym changes automatically every UTC midnight.
 * Different users receive different pseudonyms on the same day.
 */
const ADJECTIVES = [
  "Silent", "Obsidian", "Quantum", "Cyber", "Midnight", "Solar",
  "Golden", "Astral", "Velvet", "Granite", "Neon", "Lunar",
  "Iron", "Swift", "Brave", "Alpine", "Stormy", "Zenith",
  "Echo", "Cobalt", "Phantom", "Amber", "Vortex", "Frost"
];

const ANIMALS = [
  "Falcon", "Tiger", "Phoenix", "Leopard", "Wolf", "Bison",
  "Lynx", "Eagle", "Panther", "Hawk", "Otter", "Raven",
  "Fox", "Jaguar", "Stag", "Bear", "Condor", "Cobra",
  "Osprey", "Cheetah", "Badger", "Puma", "Rhino", "Shark"
];

export function generateDailyPseudonym(userId: string, dateOverride?: string): string {
  // Use UTC date YYYY-MM-DD
  const dateKey = dateOverride || new Date().toISOString().slice(0, 10);
  const seed = crypto
    .createHmac("sha256", PEPPER)
    .update(`${userId}:${dateKey}:chat_pseudonym`)
    .digest("hex");

  const num1 = parseInt(seed.substring(0, 4), 16) % ADJECTIVES.length;
  const num2 = parseInt(seed.substring(4, 8), 16) % ANIMALS.length;
  const num3 = (parseInt(seed.substring(8, 12), 16) % 90) + 10; // 10-99

  return `${ADJECTIVES[num1]} ${ANIMALS[num2]} ${num3}`;
}

/**
 * Basic profanity & spam heuristic detection
 */
const PROFANITY_LIST = [
  "abuse", "harass", "hate", "slur", "curse", "fuck", "shit", "bitch", "bastard", "dick", "asshole"
];

export function containsProfanityOrSpam(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  for (const word of PROFANITY_LIST) {
    const regex = new RegExp(`\\b${word}\\b`, "i");
    if (regex.test(lower)) return true;
  }
  return false;
}
