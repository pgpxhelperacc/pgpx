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

// Base academic structure (standard term references)
const SEED_FACULTY: Faculty[] = [
  { id: "fac-1", name: "Prof. K. Mukherjee", department: "Strategic Management" },
  { id: "fac-2", name: "Prof. R. Sharma", department: "Finance & Corporate Valuation" },
  { id: "fac-3", name: "Prof. A. Verma", department: "Operations & Supply Chain" },
  { id: "fac-4", name: "Prof. P. Gupta", department: "Marketing Management" },
  { id: "fac-5", name: "Prof. S. Sen", department: "Organizational Leadership" },
];

const SEED_COURSES: Course[] = [
  { id: "c-1", code: "STRAT-601", name: "Strategic Management & Global Execution", term: "Term 4", credits: 3.0, faculty_ids: ["fac-1"] },
  { id: "c-2", code: "FIN-602", name: "Corporate Valuation, M&A and Private Equity", term: "Term 4", credits: 3.0, faculty_ids: ["fac-2"] },
  { id: "c-3", code: "OPS-603", name: "Supply Chain Analytics & Optimization", term: "Term 4", credits: 3.0, faculty_ids: ["fac-3"] },
  { id: "c-4", code: "MKT-604", name: "Digital Marketing & Customer Growth Engines", term: "Term 4", credits: 3.0, faculty_ids: ["fac-4"] },
  { id: "c-5", code: "LEAD-605", name: "Executive Leadership in High-Performing Teams", term: "Term 4", credits: 2.0, faculty_ids: ["fac-5"] },
];

const SEED_ALLOWLIST: AllowlistEntry[] = [
  { id: "al-1", email: "rahul.v24@iimrohtak.ac.in", roll_no: "PGPX06012", name: "Rahul Verma", role: "student" },
  { id: "al-2", email: "ananya.s24@iimrohtak.ac.in", roll_no: "PGPX06005", name: "Ananya Sharma", role: "cr" },
  { id: "al-3", email: "pgpx.admin@iimrohtak.ac.in", roll_no: "ADMIN001", name: "PGPx Academic Office", role: "admin" },
];

const SEED_USERS: UserProfile[] = [
  { id: "u-rahul", email: "rahul.v24@iimrohtak.ac.in", name: "Rahul Verma", roll_no: "PGPX06012", role: "student", batch: "PGPx06", term: "Term 4", section: "A" },
  { id: "u-ananya", email: "ananya.s24@iimrohtak.ac.in", name: "Ananya Sharma", roll_no: "PGPX06005", role: "cr", batch: "PGPx06", term: "Term 4", section: "A" },
  { id: "u-admin", email: "pgpx.admin@iimrohtak.ac.in", name: "PGPx Academic Office", roll_no: "ADMIN001", role: "admin", batch: "PGPx06", term: "Term 4", section: "A" },
];

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

// In-Memory Database Store Class - Fresh Clean State
class LocalDatabaseStore {
  private users: UserProfile[] = [...SEED_USERS];
  private allowlist: AllowlistEntry[] = [...SEED_ALLOWLIST];
  private courses: Course[] = [...SEED_COURSES];
  private faculty: Faculty[] = [...SEED_FACULTY];
  private reminders: Reminder[] = [];
  private reminderHistory: ReminderHistoryEntry[] = [];
  private links: ImportantLink[] = [];
  private schedule: ScheduleEntry[] = [];
  private calendar: SemesterCalendarItem[] = [];
  private assignments: Assignment[] = [];
  private partyEvents: PartyEvent[] = [];
  private chatMessages: ChatMessage[] = [];
  private feedback: FeedbackRow[] = [];
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
      submitter_hash: submitterHash,
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

  addAssignment(data: Omit<Assignment, "id" | "created_at">): Assignment {
    const asg: Assignment = {
      ...data,
      id: `asg-${Date.now()}`,
      title: sanitizeText(data.title),
      description: sanitizeText(data.description),
    };
    this.assignments.push(asg);
    return asg;
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
    this.purgeExpiredChatMessages();

    return this.chatMessages
      .filter((m) => new Date(m.created_at) >= cutoff)
      .map((m) => {
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
      session_token: `sess-${userId.slice(0, 4)}`,
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

const globalStore = new LocalDatabaseStore();
export const db = globalStore;
