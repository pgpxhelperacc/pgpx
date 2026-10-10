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

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!emailRegex.test(trimmed)) return false;

  return trimmed.endsWith(ALLOWED_DOMAIN);
}

/**
 * OWASP Rule: XSS Prevention & Input Sanitization
 */
export function sanitizeText(input: string | null | undefined): string {
  if (!input) return "";
  let clean = input.trim();
  clean = clean.replace(/\0/g, "");
  clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  clean = clean.replace(/javascript:/gi, "");
  clean = clean.replace(/data:text\/html/gi, "");
  clean = clean.replace(/on\w+\s*=/gi, "");
  clean = clean.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return clean;
}

/**
 * Privacy Guarantee: Cryptographic One-Way Feedback Hash
 */
export function computeFeedbackHash(
  userId: string,
  subjectName: string,
  facultyName: string,
  term: string = ""
): string {
  const payload = `${userId}:${subjectName.toLowerCase().trim()}:${facultyName.toLowerCase().trim()}:${term.toLowerCase().trim()}`;
  return crypto.createHmac("sha256", PEPPER).update(payload).digest("hex");
}

/**
 * Truly Dynamic Anonymous Pseudonyms (Adjective + Animal + Random 2-3 Digit Number)
 */
const ADJECTIVES = [
  "Silent", "Obsidian", "Quantum", "Cyber", "Midnight", "Solar",
  "Golden", "Astral", "Velvet", "Granite", "Neon", "Lunar",
  "Iron", "Swift", "Brave", "Alpine", "Stormy", "Zenith",
  "Echo", "Cobalt", "Phantom", "Amber", "Vortex", "Frost",
  "Shadow", "Crimson", "Hyper", "Mystic", "Electric", "Onyx",
  "Silver", "Radiant", "Dynamic", "Titan", "Vivid", "Cosmic",
  "Nova", "Stealth", "Apex", "Prism", "Aurora", "Blaze",
  "Sonic", "Arctic", "Ember", "Pulse", "Zen", "Turbo"
];

const ANIMALS = [
  "Falcon", "Tiger", "Phoenix", "Leopard", "Wolf", "Bison",
  "Lynx", "Eagle", "Panther", "Hawk", "Otter", "Raven",
  "Fox", "Jaguar", "Stag", "Bear", "Condor", "Cobra",
  "Osprey", "Cheetah", "Badger", "Puma", "Rhino", "Shark",
  "Owl", "Viper", "Griffin", "Mantis", "Orca", "Mustang",
  "Kraken", "Dragon", "Badger", "Panda", "Gazelle", "Chameleon",
  "Husky", "Falcon", "Koala", "Heron", "Ibex", "Jaguar"
];

export function generateDailyPseudonym(uniqueSeed: string, dateOrSalt?: string): string {
  const isDate = Boolean(dateOrSalt && /^\d{4}-\d{2}-\d{2}$/.test(dateOrSalt));
  const dateStr = isDate ? dateOrSalt! : new Date().toISOString().slice(0, 10);
  const salt = !isDate && dateOrSalt ? dateOrSalt : "";

  const seed = crypto
    .createHmac("sha256", PEPPER)
    .update(`${uniqueSeed}:${salt}:${dateStr}`)
    .digest("hex");

  const num1 = parseInt(seed.substring(0, 4), 16) % ADJECTIVES.length;
  const num2 = parseInt(seed.substring(4, 8), 16) % ANIMALS.length;
  const num3 = (parseInt(seed.substring(8, 12), 16) % 90) + 10; // 10-99 (2 digits)

  return `${ADJECTIVES[num1]} ${ANIMALS[num2]} ${num3}`;
}

export function generateRandomPseudonym(): string {
  const randomBytes = crypto.randomBytes(6).toString("hex");
  return generateDailyPseudonym(randomBytes);
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
