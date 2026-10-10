import {
  UserProfile,
  AllowlistEntry,
  Course,
  Faculty,
  Reminder,
  ReminderHistoryEntry,
  ImportantLink,
  FeedbackSubmission,
  FeedbackSummary,
  ScheduleEntry,
  SemesterCalendarItem,
  Assignment,
  AlertPreferences,
  PartyEvent,
  PartyRSVPStatus,
  PartyMessage,
  ChatMessage,
  ReportItem,
  AuditLogEntry,
} from "@/types";
import { computeFeedbackHash, generateDailyPseudonym, sanitizeText } from "./security";

// Initial seed faculty
const SEED_FACULTY: Faculty[] = [
  { id: "fac-1", name: "Prof. K. Mukherjee", email: "kmukherjee@iimrohtak.ac.in", department: "Strategic Management" },
  { id: "fac-2", name: "Prof. R. Sharma", email: "rsharma@iimrohtak.ac.in", department: "Finance & Corporate Valuation" },
  { id: "fac-3", name: "Prof. A. Verma", email: "averma@iimrohtak.ac.in", department: "Operations & Supply Chain" },
  { id: "fac-4", name: "Prof. P. Gupta", email: "pgupta@iimrohtak.ac.in", department: "Marketing Management" },
  { id: "fac-5", name: "Prof. S. Sen", email: "ssen@iimrohtak.ac.in", department: "Organizational Leadership" },
];

// Initial seed courses
const SEED_COURSES: Course[] = [
  { id: "c-1", code: "STRAT-601", name: "Strategic Management & Global Execution", term: "Term 4", credits: 3.0, faculty_ids: ["fac-1"] },
  { id: "c-2", code: "FIN-602", name: "Corporate Valuation, M&A and Private Equity", term: "Term 4", credits: 3.0, faculty_ids: ["fac-2"] },
  { id: "c-3", code: "OPS-603", name: "Supply Chain Analytics & Optimization", term: "Term 4", credits: 3.0, faculty_ids: ["fac-3"] },
  { id: "c-4", code: "MKT-604", name: "Digital Marketing & Customer Growth Engines", term: "Term 4", credits: 3.0, faculty_ids: ["fac-4"] },
  { id: "c-5", code: "LEAD-605", name: "Executive Leadership in High-Performing Teams", term: "Term 4", credits: 2.0, faculty_ids: ["fac-5"] },
];

// Pre-authorized allowlist for PGPx batch
const SEED_ALLOWLIST: AllowlistEntry[] = [
  { id: "al-1", email: "rahul.v24@iimrohtak.ac.in", roll_no: "PGPX06012", name: "Rahul Verma", role: "student" },
  { id: "al-2", email: "ananya.s24@iimrohtak.ac.in", roll_no: "PGPX06005", name: "Ananya Sharma", role: "cr" },
  { id: "al-3", email: "pgpx.admin@iimrohtak.ac.in", roll_no: "ADMIN001", name: "PGPx Academic Office", role: "admin" },
  { id: "al-4", email: "rohan.d24@iimrohtak.ac.in", roll_no: "PGPX06045", name: "Rohan Desai", role: "student" },
  { id: "al-5", email: "priya.p24@iimrohtak.ac.in", roll_no: "PGPX06031", name: "Priya Patel", role: "student" },
];

// Seed users
const SEED_USERS: UserProfile[] = [
  { id: "u-rahul", email: "rahul.v24@iimrohtak.ac.in", name: "Rahul Verma", roll_no: "PGPX06012", role: "student", batch: "PGPx06", term: "Term 4", section: "A" },
  { id: "u-ananya", email: "ananya.s24@iimrohtak.ac.in", name: "Ananya Sharma", roll_no: "PGPX06005", role: "cr", batch: "PGPx06", term: "Term 4", section: "A" },
  { id: "u-admin", email: "pgpx.admin@iimrohtak.ac.in", name: "PGPx Academic Office", roll_no: "ADMIN001", role: "admin", batch: "PGPx06", term: "Term 4", section: "A" },
  { id: "u-rohan", email: "rohan.d24@iimrohtak.ac.in", name: "Rohan Desai", roll_no: "PGPX06045", role: "student", batch: "PGPx06", term: "Term 4", section: "A" },
  { id: "u-priya", email: "priya.p24@iimrohtak.ac.in", name: "Priya Patel", roll_no: "PGPX06031", role: "student", batch: "PGPx06", term: "Term 4", section: "A" },
];

const now = new Date();
const inDays = (days: number, hours = 0) => new Date(now.getTime() + days * 86400000 + hours * 3600000).toISOString();
const pastDays = (days: number) => new Date(now.getTime() - days * 86400000).toISOString();

// Seed reminders
const SEED_REMINDERS: Reminder[] = [
  {
    id: "rem-1",
    title: "FIN-602 Valuation Case 3 (Tesla vs BYD DCF)",
    description: "Submit 5-page Excel model and valuation summary report on Moodle.",
    category: "Submission",
    course_id: "c-2",
    due_at: inDays(1, 4),
    link: "https://moodle.iimrohtak.ac.in/mod/assign/view.php?id=4921",
    created_by: "u-rahul",
    creator_name: "Rahul Verma",
    verified_by: "u-ananya",
    verified_by_name: "Ananya Sharma (CR)",
    is_verified: true,
    user_subscribed: true,
    created_at: pastDays(3),
    updated_at: pastDays(1),
  },
  {
    id: "rem-2",
    title: "STRAT-601 Surprise Quiz 2 Window",
    description: "30-minute MCQ on Blue Ocean Strategy & Industry 4.0 paradigms.",
    category: "Quiz",
    course_id: "c-1",
    due_at: inDays(3, 2),
    created_by: "u-ananya",
    creator_name: "Ananya Sharma (CR)",
    verified_by: "u-ananya",
    verified_by_name: "Ananya Sharma (CR)",
    is_verified: true,
    user_subscribed: true,
    created_at: pastDays(2),
    updated_at: pastDays(2),
  },
  {
    id: "rem-3",
    title: "Term 4 Global Immersion Preference Form Deadline",
    description: "Submit top 3 destination university choices through the international relations portal.",
    category: "Other",
    due_at: inDays(5),
    link: "https://forms.iimrohtak.ac.in/international-immersion-2026",
    created_by: "u-admin",
    creator_name: "PGPx Academic Office",
    verified_by: "u-admin",
    verified_by_name: "PGPx Academic Office",
    is_verified: true,
    user_subscribed: false,
    created_at: pastDays(4),
    updated_at: pastDays(4),
  },
  {
    id: "rem-4",
    title: "OPS-603 Simulation Run Round 1",
    description: "Beer game logistics network simulation live run at Computer Centre Lab 2.",
    category: "Assignment",
    course_id: "c-3",
    due_at: inDays(0, 5),
    created_by: "u-rohan",
    creator_name: "Rohan Desai",
    is_verified: false,
    user_subscribed: false,
    created_at: pastDays(1),
    updated_at: pastDays(1),
  },
];

// Seed links
const SEED_LINKS: ImportantLink[] = [
  {
    id: "lnk-1",
    title: "IIM Rohtak PGPx Moodle Portal",
    url: "https://moodle.iimrohtak.ac.in",
    category: "Course material",
    pinned: true,
    status: "active",
    created_by: "u-admin",
    creator_name: "PGPx Academic Office",
    click_count: 245,
    created_at: pastDays(30),
  },
  {
    id: "lnk-2",
    title: "HBR Coursepack: Strategic Execution (Winter 2026)",
    url: "https://hbsp.harvard.edu/import/1049281",
    category: "Course material",
    course_id: "c-1",
    course_name: "STRAT-601",
    pinned: true,
    status: "active",
    created_by: "u-ananya",
    creator_name: "Ananya Sharma",
    click_count: 189,
    created_at: pastDays(20),
  },
  {
    id: "lnk-3",
    title: "Bloomberg Terminal Lab Slot Reservation",
    url: "https://library.iimrohtak.ac.in/bloomberg-booking",
    category: "Tools",
    pinned: false,
    status: "active",
    created_by: "u-rahul",
    creator_name: "Rahul Verma",
    click_count: 84,
    created_at: pastDays(14),
  },
  {
    id: "lnk-4",
    title: "Executive Placement Portal Resume Verification",
    url: "https://placement.iimrohtak.ac.in/pgpx/resume-drop",
    category: "Placement",
    expires_at: inDays(2),
    pinned: true,
    status: "active",
    created_by: "u-admin",
    creator_name: "Placement Cell",
    click_count: 312,
    created_at: pastDays(5),
  },
  {
    id: "lnk-5",
    title: "Hostel Maintenance & Mess Feedback Form",
    url: "https://admin.iimrohtak.ac.in/hostel-feedback",
    category: "Admin",
    pinned: false,
    status: "active",
    created_by: "u-ananya",
    creator_name: "Ananya Sharma",
    click_count: 42,
    created_at: pastDays(10),
  },
];

// Seed Schedule Entries
const SEED_SCHEDULE: ScheduleEntry[] = [
  {
    id: "sch-1",
    course_id: "c-1",
    course_code: "STRAT-601",
    course_name: "Strategic Management & Global Execution",
    faculty_id: "fac-1",
    faculty_name: "Prof. K. Mukherjee",
    room: "Lecture Theatre 2 (LT-2)",
    starts_at: inDays(0, 1),
    ends_at: inDays(0, 2.5),
    type: "class",
    status: "scheduled",
    section: "A",
  },
  {
    id: "sch-2",
    course_id: "c-2",
    course_code: "FIN-602",
    course_name: "Corporate Valuation & M&A",
    faculty_id: "fac-2",
    faculty_name: "Prof. R. Sharma",
    room: "LT-1 (Auditorium Wing)",
    starts_at: inDays(0, 3.5),
    ends_at: inDays(0, 5),
    type: "class",
    status: "rescheduled",
    changed_note: "Shifted from Room 104 to LT-1 to accommodate Bloomberg demo",
    section: "A",
  },
  {
    id: "sch-3",
    course_id: "c-3",
    course_code: "OPS-603",
    course_name: "Supply Chain Analytics & Optimization",
    faculty_id: "fac-3",
    faculty_name: "Prof. A. Verma",
    room: "Management Development Center (MDC-4)",
    starts_at: inDays(1, 2),
    ends_at: inDays(1, 3.5),
    type: "class",
    status: "scheduled",
    section: "A",
  },
  {
    id: "sch-4",
    course_id: "c-4",
    course_code: "MKT-604",
    course_name: "Digital Marketing & Customer Growth",
    faculty_id: "fac-4",
    faculty_name: "Prof. P. Gupta",
    room: "LT-2",
    starts_at: inDays(1, 4),
    ends_at: inDays(1, 5.5),
    type: "quiz",
    status: "scheduled",
    changed_note: "First 20 minutes allocated to Quiz 1",
    section: "A",
  },
];

// Seed Semester Calendar
const SEED_CALENDAR: SemesterCalendarItem[] = [
  { id: "cal-1", term: "Term 4", label: "Term 4 Academic Commencement", kind: "term_boundary", start_date: "2026-09-01", end_date: "2026-09-01", notes: "Orientation & Course registration finalize" },
  { id: "cal-2", term: "Term 4", label: "Dussehra Festive Break", kind: "holiday", start_date: "2026-10-20", end_date: "2026-10-22", notes: "No lectures or quizzes" },
  { id: "cal-3", term: "Term 4", label: "Mid-Term Examination Window", kind: "exam_window", start_date: "2026-10-26", end_date: "2026-10-30", notes: "Slot 1: 09:30-12:30, Slot 2: 14:00-17:00" },
  { id: "cal-4", term: "Term 4", label: "Live Industry Consulting Project Week", kind: "project_week", start_date: "2026-11-09", end_date: "2026-11-15", notes: "Client presentations & faculty audit" },
  { id: "cal-5", term: "Term 4", label: "Diwali Recess", kind: "break", start_date: "2026-11-16", end_date: "2026-11-20", notes: "Institute closed" },
  { id: "cal-6", term: "Term 4", label: "End-Term Final Examinations", kind: "exam_window", start_date: "2026-12-14", end_date: "2026-12-19", notes: "Course pack evaluations" },
];

// Seed Assignments
const SEED_ASSIGNMENTS: Assignment[] = [
  {
    id: "asg-1",
    course_id: "c-2",
    course_code: "FIN-602",
    course_name: "Corporate Valuation & M&A",
    title: "Valuation Model: Tesla vs BYD DCF Analysis",
    description: "Detailed financial model with 3-scenario revenue forecast, WACC calculation, and sensitivity tables.",
    type: "group",
    due_at: inDays(1, 4),
    weightage: 25,
    submission_url: "https://moodle.iimrohtak.ac.in/mod/assign/view.php?id=4921",
    created_by: "u-admin",
    creator_name: "Prof. R. Sharma",
    user_status: "in_progress",
  },
  {
    id: "asg-2",
    course_id: "c-1",
    course_code: "STRAT-601",
    course_name: "Strategic Management & Global Execution",
    title: "Global EV Expansion Strategy (NIO Inc)",
    description: "Individual strategic case brief examining regulatory barriers and battery-swapping infrastructure.",
    type: "individual",
    due_at: inDays(4),
    weightage: 20,
    submission_url: "https://moodle.iimrohtak.ac.in/mod/assign/view.php?id=4922",
    created_by: "u-admin",
    creator_name: "Prof. K. Mukherjee",
    user_status: "not_started",
  },
  {
    id: "asg-3",
    course_id: "c-3",
    course_code: "OPS-603",
    course_name: "Supply Chain Analytics & Optimization",
    title: "Omnichannel Logistics Optimization Network Model",
    description: "Mixed integer linear programming formulation using Python/PuLP for warehouse footprint.",
    type: "group",
    due_at: inDays(8),
    weightage: 25,
    submission_url: "https://moodle.iimrohtak.ac.in/mod/assign/view.php?id=4925",
    created_by: "u-ananya",
    creator_name: "Ananya Sharma (CR)",
    user_status: "not_started",
  },
];

// Seed Party & Social Events
const SEED_PARTY_EVENTS: PartyEvent[] = [
  {
    id: "pty-1",
    host_id: "u-rohan",
    host_name: "Rohan Desai",
    title: "Post-Midterm Rooftop BBQ & Sundowner",
    category: "House Party",
    starts_at: inDays(2, 6),
    venue: "Falcon Heights Terrace, Sector 14, Rohtak",
    capacity: 45,
    visibility: "public_batch",
    budget_per_head: 650,
    description: "Celebrating end of Term 4 Midterms! Tandoor, grill, mocktails, music, and board games. Batchmates and partners welcome.",
    cover_image: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80",
    status: "active",
    created_at: pastDays(2),
    rsvps: [
      { user_id: "u-rahul", user_name: "Rahul Verma", status: "going" },
      { user_id: "u-ananya", user_name: "Ananya Sharma", status: "going" },
      { user_id: "u-priya", user_name: "Priya Patel", status: "maybe" },
    ],
    user_rsvp: "going",
    headcount: { going: 24, maybe: 6, cant: 3 },
    polls: [
      {
        id: "poll-1",
        event_id: "pty-1",
        question: "Preferred Start Timing?",
        options: [
          { id: "opt-1", text: "6:30 PM (Catch sunset)", vote_count: 14 },
          { id: "opt-2", text: "8:00 PM (Dinner & Party)", vote_count: 8 },
        ],
        user_voted_option_id: "opt-1",
      },
    ],
    checklist: [
      { id: "chk-1", event_id: "pty-1", item: "JBL PartyBox Bluetooth Speaker", claimed_by: "u-rahul", claimed_by_name: "Rahul Verma", paid_status: true, estimated_cost: 0 },
      { id: "chk-2", event_id: "pty-1", item: "Marinated Paneer & Veggie Skewers", claimed_by: "u-priya", claimed_by_name: "Priya Patel", paid_status: false, estimated_cost: 1200 },
      { id: "chk-3", event_id: "pty-1", item: "Ice Boxes & Soft Drinks Cans", paid_status: false, estimated_cost: 900 },
      { id: "chk-4", event_id: "pty-1", item: "Disposable Plates & Napkins", claimed_by: "u-ananya", claimed_by_name: "Ananya Sharma", paid_status: true, estimated_cost: 400 },
    ],
    messages: [
      { id: "msg-1", event_id: "pty-1", user_id: "u-rohan", user_name: "Rohan Desai", body: "Please confirm your RSVPs by tomorrow evening so we finalize the catering quantities!", created_at: pastDays(1) },
      { id: "msg-2", event_id: "pty-1", user_id: "u-rahul", user_name: "Rahul Verma", body: "I am driving from campus Gate 2 at 6:15 PM, 3 seats open in my car!", created_at: pastDays(0) },
    ],
  },
  {
    id: "pty-2",
    host_id: "u-priya",
    host_name: "Priya Patel",
    title: "Saturday Evening Delhi CyberHub Dinner & Comedy Night",
    category: "Dinner",
    starts_at: inDays(5, 7),
    venue: "DLF CyberHub, Gurugram (Carpool from Rohtak)",
    capacity: 20,
    visibility: "public_batch",
    budget_per_head: 1500,
    description: "Group outing to Gurugram for dinner and stand-up comedy show. Planning 3 shared cabs.",
    status: "active",
    created_at: pastDays(1),
    rsvps: [
      { user_id: "u-rahul", user_name: "Rahul Verma", status: "maybe" },
    ],
    headcount: { going: 11, maybe: 4, cant: 1 },
  },
];

// Seed Anonymous Chat Messages (recent, within 24 hours)
const SEED_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: "chat-1",
    room_id: "room-default",
    pseudonym: "Quantum Falcon 42",
    body: "Does anyone have the Excel template for Prof. Sharma's DCF sensitivity analysis?",
    reactions: { "👍": 4, "🔥": 1 },
    created_at: new Date(now.getTime() - 2 * 3600000).toISOString(),
  },
  {
    id: "chat-2",
    room_id: "room-default",
    pseudonym: "Midnight Lynx 19",
    body: "Check the Important Links tab under Course Material — CR pinned the direct link to the Moodle folder!",
    reactions: { "❤️": 5, "🙏": 3 },
    created_at: new Date(now.getTime() - 90 * 60000).toISOString(),
  },
  {
    id: "chat-3",
    room_id: "room-default",
    pseudonym: "Neon Tiger 88",
    body: "Reminder that tomorrow's STRAT lecture starts strictly at 9:30 AM in LT-2, guest speaker from McKinsey joining online.",
    reactions: { "👀": 7 },
    created_at: new Date(now.getTime() - 25 * 60000).toISOString(),
  },
];

// Seed Feedback Entries: Provide 5 responses for course c-1, faculty fac-1 to demonstrate ready state!
// And 2 responses for course c-2 to demonstrate privacy threshold (<5 responses) protection!
interface FeedbackRow {
  id: string;
  course_id: string;
  faculty_id: string;
  term: string;
  ratings: {
    content_clarity: number;
    pace: number;
    engagement: number;
    assessment_fairness: number;
    practical_relevance: number;
  };
  comment?: string;
  submitter_hash: string;
  hidden: boolean;
  created_at: string;
}

const SEED_FEEDBACK: FeedbackRow[] = [
  {
    id: "fb-1",
    course_id: "c-1",
    faculty_id: "fac-1",
    term: "Term 4",
    ratings: { content_clarity: 5, pace: 4, engagement: 5, assessment_fairness: 4, practical_relevance: 5 },
    comment: "Exceptional real-world corporate case discussions. Cold calls keep everyone fully prepped.",
    submitter_hash: computeFeedbackHash("dummy-user-1", "c-1", "fac-1", "Term 4"),
    hidden: false,
    created_at: pastDays(10),
  },
  {
    id: "fb-2",
    course_id: "c-1",
    faculty_id: "fac-1",
    term: "Term 4",
    ratings: { content_clarity: 4, pace: 4, engagement: 4, assessment_fairness: 5, practical_relevance: 5 },
    comment: "Very structured slides and clear expectations for the group submission.",
    submitter_hash: computeFeedbackHash("dummy-user-2", "c-1", "fac-1", "Term 4"),
    hidden: false,
    created_at: pastDays(8),
  },
  {
    id: "fb-3",
    course_id: "c-1",
    faculty_id: "fac-1",
    term: "Term 4",
    ratings: { content_clarity: 5, pace: 3, engagement: 5, assessment_fairness: 4, practical_relevance: 4 },
    comment: "Pacing can be slightly rapid during Porter's five forces deep-dive, but overall fantastic.",
    submitter_hash: computeFeedbackHash("dummy-user-3", "c-1", "fac-1", "Term 4"),
    hidden: false,
    created_at: pastDays(7),
  },
  {
    id: "fb-4",
    course_id: "c-1",
    faculty_id: "fac-1",
    term: "Term 4",
    ratings: { content_clarity: 4, pace: 4, engagement: 4, assessment_fairness: 4, practical_relevance: 5 },
    comment: "Practical industry examples and high relevance for consulting interviews.",
    submitter_hash: computeFeedbackHash("dummy-user-4", "c-1", "fac-1", "Term 4"),
    hidden: false,
    created_at: pastDays(5),
  },
  {
    id: "fb-5",
    course_id: "c-1",
    faculty_id: "fac-1",
    term: "Term 4",
    ratings: { content_clarity: 5, pace: 5, engagement: 5, assessment_fairness: 5, practical_relevance: 5 },
    comment: "One of the best modules this term. Great balance of theory and practice.",
    submitter_hash: computeFeedbackHash("dummy-user-5", "c-1", "fac-1", "Term 4"),
    hidden: false,
    created_at: pastDays(2),
  },
  // Under-threshold course (2 responses only)
  {
    id: "fb-6",
    course_id: "c-2",
    faculty_id: "fac-2",
    term: "Term 4",
    ratings: { content_clarity: 4, pace: 3, engagement: 4, assessment_fairness: 4, practical_relevance: 5 },
    comment: "Financial modeling is rigorous.",
    submitter_hash: computeFeedbackHash("dummy-user-1", "c-2", "fac-2", "Term 4"),
    hidden: false,
    created_at: pastDays(4),
  },
  {
    id: "fb-7",
    course_id: "c-2",
    faculty_id: "fac-2",
    term: "Term 4",
    ratings: { content_clarity: 5, pace: 4, engagement: 4, assessment_fairness: 4, practical_relevance: 4 },
    comment: "DCF session was very insightful.",
    submitter_hash: computeFeedbackHash("dummy-user-2", "c-2", "fac-2", "Term 4"),
    hidden: false,
    created_at: pastDays(3),
  },
];

// In-Memory Database Store Class
class LocalDatabaseStore {
  private users: UserProfile[] = [...SEED_USERS];
  private allowlist: AllowlistEntry[] = [...SEED_ALLOWLIST];
  private courses: Course[] = [...SEED_COURSES];
  private faculty: Faculty[] = [...SEED_FACULTY];
  private reminders: Reminder[] = [...SEED_REMINDERS];
  private reminderHistory: ReminderHistoryEntry[] = [];
  private links: ImportantLink[] = [...SEED_LINKS];
  private schedule: ScheduleEntry[] = [...SEED_SCHEDULE];
  private calendar: SemesterCalendarItem[] = [...SEED_CALENDAR];
  private assignments: Assignment[] = [...SEED_ASSIGNMENTS];
  private partyEvents: PartyEvent[] = [...SEED_PARTY_EVENTS];
  private chatMessages: ChatMessage[] = [...SEED_CHAT_MESSAGES];
  private feedback: FeedbackRow[] = [...SEED_FEEDBACK];
  private reports: ReportItem[] = [];
  private auditLogs: AuditLogEntry[] = [];

  // USERS & AUTH
  getUsers(): UserProfile[] {
    return this.users;
  }

  getUserById(id: string): UserProfile | undefined {
    return this.users.find((u) => u.id === id);
  }

  getUserByEmail(email: string): UserProfile | undefined {
    return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  upsertUser(user: Partial<UserProfile> & { email: string; name: string }): UserProfile {
    const existing = this.getUserByEmail(user.email);
    if (existing) {
      Object.assign(existing, user);
      return existing;
    }
    const allowlisted = this.allowlist.find((a) => a.email.toLowerCase() === user.email.toLowerCase());
    const newUser: UserProfile = {
      id: user.id || `u-${Date.now()}`,
      email: user.email.toLowerCase(),
      name: user.name || (allowlisted?.name ?? "PGPx Student"),
      roll_no: user.roll_no || (allowlisted?.roll_no ?? `PGPX06${Math.floor(100 + Math.random() * 900)}`),
      role: user.role || (allowlisted?.role ?? "student"),
      batch: user.batch || "PGPx06",
      term: user.term || "Term 4",
      section: user.section || "A",
      created_at: new Date().toISOString(),
    };
    this.users.push(newUser);
    return newUser;
  }

  getAllowlist(): AllowlistEntry[] {
    return this.allowlist;
  }

  addAllowlistEntry(entry: Omit<AllowlistEntry, "id">): AllowlistEntry {
    const newEntry: AllowlistEntry = { ...entry, id: `al-${Date.now()}` };
    this.allowlist.push(newEntry);
    return newEntry;
  }

  // ACADEMICS
  getCourses(): Course[] {
    return this.courses;
  }

  getFaculty(): Faculty[] {
    return this.faculty;
  }

  // REMINDERS
  getReminders(): Reminder[] {
    return [...this.reminders].sort(
      (a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime()
    );
  }

  addReminder(
    data: Omit<Reminder, "id" | "created_at" | "updated_at">,
    actorId: string,
    actorName: string
  ): Reminder {
    const id = `rem-${Date.now()}`;
    const newReminder: Reminder = {
      ...data,
      id,
      title: sanitizeText(data.title),
      description: sanitizeText(data.description),
      link: sanitizeText(data.link),
      created_by: actorId,
      creator_name: actorName,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.reminders.push(newReminder);

    this.logAuditEvent({
      actor_id: actorId,
      actor_name: actorName,
      action: "CREATE_REMINDER",
      target: id,
      metadata: { title: newReminder.title },
    });

    return newReminder;
  }

  updateReminder(
    id: string,
    updates: Partial<Reminder>,
    actorId: string,
    actorName: string,
    actorRole: string
  ): { success: boolean; reminder?: Reminder; error?: string } {
    const reminder = this.reminders.find((r) => r.id === id);
    if (!reminder) return { success: false, error: "Reminder not found" };

    // Permissions check: Owner, CR, or Admin only!
    const isOwner = reminder.created_by === actorId;
    const isModerator = actorRole === "cr" || actorRole === "admin";
    if (!isOwner && !isModerator) {
      return { success: false, error: "Forbidden: Only creator, CR or Admin can edit this reminder" };
    }

    const diff: { field: string; old_value: any; new_value: any }[] = [];
    (Object.keys(updates) as (keyof Reminder)[]).forEach((key) => {
      if (key !== "id" && key !== "created_at" && updates[key] !== undefined && updates[key] !== reminder[key]) {
        diff.push({ field: key, old_value: reminder[key], new_value: updates[key] });
      }
    });

    if (diff.length > 0) {
      Object.assign(reminder, updates, { updated_at: new Date().toISOString() });
      const historyEntry: ReminderHistoryEntry = {
        id: `rh-${Date.now()}`,
        reminder_id: id,
        changed_by: actorId,
        changed_by_name: actorName,
        diff,
        changed_at: new Date().toISOString(),
      };
      this.reminderHistory.push(historyEntry);

      this.logAuditEvent({
        actor_id: actorId,
        actor_name: actorName,
        action: "UPDATE_REMINDER",
        target: id,
        metadata: { diff },
      });
    }

    return { success: true, reminder };
  }

  deleteReminder(
    id: string,
    actorId: string,
    actorName: string,
    actorRole: string
  ): { success: boolean; error?: string } {
    const index = this.reminders.findIndex((r) => r.id === id);
    if (index === -1) return { success: false, error: "Reminder not found" };

    const reminder = this.reminders[index];
    const isOwner = reminder.created_by === actorId;
    const isModerator = actorRole === "cr" || actorRole === "admin";
    if (!isOwner && !isModerator) {
      return { success: false, error: "Forbidden: Only creator, CR or Admin can delete this reminder" };
    }

    this.reminders.splice(index, 1);
    this.logAuditEvent({
      actor_id: actorId,
      actor_name: actorName,
      action: "DELETE_REMINDER",
      target: id,
    });

    return { success: true };
  }

  verifyReminder(
    id: string,
    verifierId: string,
    verifierName: string
  ): { success: boolean; reminder?: Reminder; error?: string } {
    const reminder = this.reminders.find((r) => r.id === id);
    if (!reminder) return { success: false, error: "Reminder not found" };

    reminder.is_verified = true;
    reminder.verified_by = verifierId;
    reminder.verified_by_name = `${verifierName} (CR Verified)`;
    reminder.updated_at = new Date().toISOString();

    return { success: true, reminder };
  }

  getReminderHistory(reminderId: string): ReminderHistoryEntry[] {
    return this.reminderHistory
      .filter((h) => h.reminder_id === reminderId)
      .sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime());
  }

  toggleReminderSubscription(reminderId: string, userId: string): boolean {
    const reminder = this.reminders.find((r) => r.id === reminderId);
    if (reminder) {
      reminder.user_subscribed = !reminder.user_subscribed;
      return !!reminder.user_subscribed;
    }
    return false;
  }

  // IMPORTANT LINKS
  getLinks(): ImportantLink[] {
    const now = new Date();
    // Auto-archive expired links
    this.links.forEach((l) => {
      if (l.expires_at && new Date(l.expires_at) < now && l.status === "active") {
        l.status = "archived";
      }
    });

    return [...this.links].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.click_count - a.click_count;
    });
  }

  addLink(
    data: Omit<ImportantLink, "id" | "click_count" | "created_at">,
    actorId: string,
    actorName: string
  ): ImportantLink {
    const newLink: ImportantLink = {
      ...data,
      id: `lnk-${Date.now()}`,
      title: sanitizeText(data.title),
      url: sanitizeText(data.url),
      created_by: actorId,
      creator_name: actorName,
      click_count: 0,
      created_at: new Date().toISOString(),
    };
    this.links.push(newLink);
    return newLink;
  }

  incrementLinkClick(id: string): number {
    const link = this.links.find((l) => l.id === id);
    if (link) {
      link.click_count += 1;
      return link.click_count;
    }
    return 0;
  }

  // FACULTY FEEDBACK (Guaranteed Anonymity)
  submitFeedback(
    submission: FeedbackSubmission,
    userId: string
  ): { success: boolean; error?: string } {
    const submitterHash = computeFeedbackHash(
      userId,
      submission.course_id,
      submission.faculty_id,
      submission.term
    );

    // Enforce 1 submission per student per course per term
    const alreadySubmitted = this.feedback.some(
      (fb) =>
        fb.course_id === submission.course_id &&
        fb.faculty_id === submission.faculty_id &&
        fb.term === submission.term &&
        fb.submitter_hash === submitterHash
    );

    if (alreadySubmitted) {
      return { success: false, error: "You have already submitted anonymous feedback for this faculty/course." };
    }

    const row: FeedbackRow = {
      id: `fb-${Date.now()}`,
      course_id: submission.course_id,
      faculty_id: submission.faculty_id,
      term: submission.term,
      ratings: submission.ratings,
      comment: sanitizeText(submission.comment),
      submitter_hash: submitterHash, // No linkable userId stored!
      hidden: false,
      created_at: new Date().toISOString(),
    };

    this.feedback.push(row);
    return { success: true };
  }

  getFacultyFeedbackSummary(courseId: string, facultyId: string, term: string): FeedbackSummary {
    const matching = this.feedback.filter(
      (fb) =>
        fb.course_id === courseId &&
        fb.faculty_id === facultyId &&
        fb.term === term &&
        !fb.hidden
    );

    const count = matching.length;
    // Anonymity rule: Show aggregates ONLY when at least 5 responses exist!
    if (count < 5) {
      return {
        status: "insufficient_responses",
        count,
        threshold: 5,
        message: `Aggregated feedback requires at least 5 student responses to protect anonymity (currently ${count}/5).`,
      };
    }

    const totals = { content_clarity: 0, pace: 0, engagement: 0, assessment_fairness: 0, practical_relevance: 0 };
    matching.forEach((fb) => {
      totals.content_clarity += fb.ratings.content_clarity;
      totals.pace += fb.ratings.pace;
      totals.engagement += fb.ratings.engagement;
      totals.assessment_fairness += fb.ratings.assessment_fairness;
      totals.practical_relevance += fb.ratings.practical_relevance;
    });

    const round = (num: number) => Math.round((num / count) * 10) / 10;
    const averages = {
      content_clarity: round(totals.content_clarity),
      pace: round(totals.pace),
      engagement: round(totals.engagement),
      assessment_fairness: round(totals.assessment_fairness),
      practical_relevance: round(totals.practical_relevance),
      overall: round(
        (totals.content_clarity + totals.pace + totals.engagement + totals.assessment_fairness + totals.practical_relevance) / 5
      ),
    };

    const comments = matching
      .map((m) => m.comment)
      .filter((c): c is string => typeof c === "string" && c.trim().length > 0);

    return {
      status: "ready",
      count,
      threshold: 5,
      averages,
      comments,
    };
  }

  // SCHEDULE & CALENDAR
  getSchedule(): ScheduleEntry[] {
    return [...this.schedule].sort(
      (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
    );
  }

  addScheduleEntry(entry: Omit<ScheduleEntry, "id">): ScheduleEntry {
    const newEntry: ScheduleEntry = {
      ...entry,
      id: `sch-${Date.now()}`,
    };
    this.schedule.push(newEntry);
    return newEntry;
  }

  updateScheduleEntry(id: string, updates: Partial<ScheduleEntry>): ScheduleEntry | null {
    const entry = this.schedule.find((s) => s.id === id);
    if (!entry) return null;
    Object.assign(entry, updates);
    return entry;
  }

  getSemesterCalendar(): SemesterCalendarItem[] {
    return [...this.calendar].sort(
      (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    );
  }

  // ASSIGNMENTS & PROGRESS
  getAssignments(userId?: string): Assignment[] {
    return [...this.assignments].sort(
      (a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime()
    );
  }

  updateAssignmentProgress(
    assignmentId: string,
    status: "not_started" | "in_progress" | "done"
  ): boolean {
    const asg = this.assignments.find((a) => a.id === assignmentId);
    if (asg) {
      asg.user_status = status;
      return true;
    }
    return false;
  }

  // PARTY & SOCIALS
  getPartyEvents(userId?: string): PartyEvent[] {
    return [...this.partyEvents].map((evt) => {
      const userRSVP = evt.rsvps.find((r) => r.user_id === userId)?.status;
      return { ...evt, user_rsvp: userRSVP };
    });
  }

  createPartyEvent(
    data: Omit<PartyEvent, "id" | "rsvps" | "headcount" | "created_at" | "host_id" | "host_name">,
    hostId: string,
    hostName: string
  ): PartyEvent {
    const newEvent: PartyEvent = {
      ...data,
      id: `pty-${Date.now()}`,
      host_id: hostId,
      host_name: hostName,
      title: sanitizeText(data.title),
      venue: sanitizeText(data.venue),
      description: sanitizeText(data.description),
      rsvps: [{ user_id: hostId, user_name: hostName, status: "going" }],
      user_rsvp: "going",
      headcount: { going: 1, maybe: 0, cant: 0 },
      created_at: new Date().toISOString(),
    };
    this.partyEvents.push(newEvent);
    return newEvent;
  }

  rsvpPartyEvent(eventId: string, userId: string, userName: string, status: PartyRSVPStatus): boolean {
    const evt = this.partyEvents.find((e) => e.id === eventId);
    if (!evt) return false;

    const existingIndex = evt.rsvps.findIndex((r) => r.user_id === userId);
    if (existingIndex >= 0) {
      evt.rsvps[existingIndex].status = status;
    } else {
      evt.rsvps.push({ user_id: userId, user_name: userName, status });
    }

    // Recalculate headcount
    evt.headcount = {
      going: evt.rsvps.filter((r) => r.status === "going").length,
      maybe: evt.rsvps.filter((r) => r.status === "maybe").length,
      cant: evt.rsvps.filter((r) => r.status === "cant").length,
    };
    evt.user_rsvp = status;
    return true;
  }

  votePartyPoll(eventId: string, pollId: string, optionId: string): boolean {
    const evt = this.partyEvents.find((e) => e.id === eventId);
    const poll = evt?.polls?.find((p) => p.id === pollId);
    if (!poll) return false;

    poll.options.forEach((opt) => {
      if (opt.id === optionId) opt.vote_count += 1;
    });
    poll.user_voted_option_id = optionId;
    return true;
  }

  claimPartyItem(eventId: string, itemId: string, userId: string, userName: string): boolean {
    const evt = this.partyEvents.find((e) => e.id === eventId);
    const item = evt?.checklist?.find((i) => i.id === itemId);
    if (!item) return false;

    if (item.claimed_by === userId) {
      // Unclaim
      item.claimed_by = undefined;
      item.claimed_by_name = undefined;
    } else {
      item.claimed_by = userId;
      item.claimed_by_name = userName;
    }
    return true;
  }

  addPartyMessage(eventId: string, userId: string, userName: string, body: string): PartyMessage | null {
    const evt = this.partyEvents.find((e) => e.id === eventId);
    if (!evt) return null;

    const msg: PartyMessage = {
      id: `pmsg-${Date.now()}`,
      event_id: eventId,
      user_id: userId,
      user_name: userName,
      body: sanitizeText(body),
      created_at: new Date().toISOString(),
    };
    if (!evt.messages) evt.messages = [];
    evt.messages.push(msg);
    return msg;
  }

  // ANONYMOUS CHAT (24-Hour Lifetime)
  getChatMessages(userId?: string): ChatMessage[] {
    const cutoff = new Date(Date.now() - 24 * 3600000);
    // Hard delete messages older than 24h
    this.purgeExpiredChatMessages();

    return this.chatMessages
      .filter((m) => new Date(m.created_at) >= cutoff)
      .map((m) => {
        // Strip sensitive internal session tokens before returning
        const { session_token, ...safeMsg } = m;
        return safeMsg;
      })
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  postChatMessage(body: string, userId: string): ChatMessage {
    const pseudonym = generateDailyPseudonym(userId);
    const msg: ChatMessage = {
      id: `cmsg-${Date.now()}`,
      room_id: "room-default",
      pseudonym,
      body: sanitizeText(body),
      session_token: `sess-${userId.slice(0, 4)}`, // used internally for abuse/rate limit
      reactions: {},
      created_at: new Date().toISOString(),
      is_own: true,
    };
    this.chatMessages.push(msg);
    return msg;
  }

  reactToChatMessage(messageId: string, emoji: string): boolean {
    const msg = this.chatMessages.find((m) => m.id === messageId);
    if (msg) {
      msg.reactions[emoji] = (msg.reactions[emoji] || 0) + 1;
      return true;
    }
    return false;
  }

  purgeExpiredChatMessages(): number {
    const cutoff = new Date(Date.now() - 24 * 3600000);
    const beforeCount = this.chatMessages.length;
    this.chatMessages = this.chatMessages.filter(
      (m) => new Date(m.created_at) >= cutoff
    );
    return beforeCount - this.chatMessages.length;
  }

  // AUDIT & REPORTS
  createReport(data: Omit<ReportItem, "id" | "status" | "created_at">): ReportItem {
    const item: ReportItem = {
      ...data,
      id: `rep-${Date.now()}`,
      reason: sanitizeText(data.reason),
      status: "pending",
      created_at: new Date().toISOString(),
    };
    this.reports.push(item);
    return item;
  }

  getReports(): ReportItem[] {
    return this.reports;
  }

  resolveReport(id: string, action: "actioned" | "dismissed"): boolean {
    const report = this.reports.find((r) => r.id === id);
    if (report) {
      report.status = action;
      return true;
    }
    return false;
  }

  logAuditEvent(entry: Omit<AuditLogEntry, "id" | "created_at">): AuditLogEntry {
    const log: AuditLogEntry = {
      ...entry,
      id: `aud-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    this.auditLogs.push(log);
    return log;
  }

  getAuditLogs(): AuditLogEntry[] {
    return this.auditLogs;
  }
}

// Global Singleton Store Instance
const globalStore = new LocalDatabaseStore();
export const db = globalStore;
