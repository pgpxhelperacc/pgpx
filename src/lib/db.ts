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
  FeedbackThread,
  FeedbackComment,
  ScheduleEntry,
  SemesterCalendarItem,
  Assignment,
  PartyEvent,
  PartyRSVPStatus,
  PartyMessage,
  ChatMessage,
  ReportItem,
  AuditLogEntry,
} from "@/types";
import fs from "fs";
import path from "path";
import os from "os";
import { generateDailyPseudonym, sanitizeText, computeFeedbackHash } from "./security";

const CHAT_FILE = path.join(os.tmpdir(), "pgpx_chat_messages_v1.json");

function loadPersistedChatMessages(): ChatMessage[] {
  try {
    if (typeof globalThis !== "undefined" && Array.isArray((globalThis as any).__pgpx_chat_messages)) {
      return (globalThis as any).__pgpx_chat_messages;
    }
    if (fs.existsSync(CHAT_FILE)) {
      const data = fs.readFileSync(CHAT_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        if (typeof globalThis !== "undefined") {
          (globalThis as any).__pgpx_chat_messages = parsed;
        }
        return parsed;
      }
    }
  } catch (err) {
    // silent
  }
  return [];
}

function persistChatMessages(messages: ChatMessage[]) {
  try {
    if (typeof globalThis !== "undefined") {
      (globalThis as any).__pgpx_chat_messages = messages;
    }
    fs.writeFileSync(CHAT_FILE, JSON.stringify(messages), "utf-8");
  } catch (err) {
    // silent
  }
}

// Base academic structure (Zero dummy data - clean fresh portal)
const SEED_FACULTY: Faculty[] = [];
const SEED_COURSES: Course[] = [];

const SEED_ALLOWLIST: AllowlistEntry[] = [
  { id: "al-1", email: "student@iimrohtak.ac.in", roll_no: "PGPX-01", name: "PGPx Student", role: "student" },
  { id: "al-2", email: "cr@iimrohtak.ac.in", roll_no: "PGPX-CR", name: "Class Representative", role: "cr" },
  { id: "al-3", email: "pgpx.admin@iimrohtak.ac.in", roll_no: "ADMIN-01", name: "PGPx Academic Office", role: "admin" },
];

const SEED_USERS: UserProfile[] = [
  { id: "u-batch", email: "student@iimrohtak.ac.in", name: "Batch Member", roll_no: "PGPx", role: "student", batch: "PGPx", term: "", section: "A" },
  { id: "u-cr", email: "cr@iimrohtak.ac.in", name: "Class Representative", roll_no: "PGPx-CR", role: "cr", batch: "PGPx", term: "", section: "A" },
  { id: "u-admin", email: "pgpx.admin@iimrohtak.ac.in", name: "PGPx Academic Office", roll_no: "ADMIN", role: "admin", batch: "PGPx", term: "", section: "A" },
];

interface FeedbackThreadRecord {
  id: string;
  subject_name: string;
  faculty_name: string;
  title: string;
  review: string;
  rating?: number;
  author_pseudonym: string;
  upvotes: number;
  downvotes: number;
  voters: Record<string, "up" | "down">;
  comments: FeedbackComment[];
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
  private chatMessages: ChatMessage[] = loadPersistedChatMessages();
  private feedbackThreads: FeedbackThreadRecord[] = [];
  private legacyFeedbackSubmissions: FeedbackSubmission[] = [];
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
      name: user.name || (allowlisted?.name ?? "PGPx Member"),
      roll_no: user.roll_no || (allowlisted?.roll_no ?? "PGPx"),
      role: user.role || (allowlisted?.role ?? "student"),
      batch: user.batch || "PGPx",
      term: user.term || "",
      section: user.section || "A",
      created_at: new Date().toISOString(),
    };
    this.users.push(newUser);
    return newUser;
  }

  // ALLOWLIST
  getAllowlist(): AllowlistEntry[] {
    return this.allowlist;
  }

  addToAllowlist(entry: Omit<AllowlistEntry, "id">): AllowlistEntry {
    const existing = this.allowlist.find((a) => a.email.toLowerCase() === entry.email.toLowerCase());
    if (existing) {
      Object.assign(existing, entry);
      return existing;
    }
    const newEntry: AllowlistEntry = {
      ...entry,
      id: `al-${Date.now()}`,
      email: entry.email.toLowerCase(),
    };
    this.allowlist.push(newEntry);
    return newEntry;
  }

  addAllowlistEntry(entry: Omit<AllowlistEntry, "id">): AllowlistEntry {
    return this.addToAllowlist(entry);
  }

  removeFromAllowlist(email: string): boolean {
    const idx = this.allowlist.findIndex((a) => a.email.toLowerCase() === email.toLowerCase());
    if (idx >= 0) {
      this.allowlist.splice(idx, 1);
      return true;
    }
    return false;
  }

  // COURSES & FACULTY
  getCourses(): Course[] {
    return this.courses;
  }

  getFaculty(): Faculty[] {
    return this.faculty;
  }

  addCourse(course: Course): Course {
    this.courses.push(course);
    return course;
  }

  addFaculty(faculty: Faculty): Faculty {
    this.faculty.push(faculty);
    return faculty;
  }

  // REMINDERS / IMPORTANT DATES
  getReminders(): Reminder[] {
    return [...this.reminders].sort(
      (a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime()
    );
  }

  getReminderById(id: string): Reminder | undefined {
    return this.reminders.find((r) => r.id === id);
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

    if (actorRole !== "cr" && actorRole !== "admin" && reminder.created_by !== actorId) {
      return { success: false, error: "Forbidden: You can only edit your own reminder unless you are a CR or Admin" };
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
    if (actorRole !== "cr" && actorRole !== "admin" && reminder.created_by !== actorId) {
      return { success: false, error: "Forbidden: You can only delete your own reminder unless you are a CR or Admin" };
    }
    this.reminders.splice(index, 1);
    return { success: true };
  }

  verifyReminder(id: string, verifiedBy: string, verifiedByName: string): Reminder | null {
    const reminder = this.reminders.find((r) => r.id === id);
    if (!reminder) return null;
    reminder.is_verified = true;
    reminder.verified_by = verifiedBy;
    reminder.verified_by_name = verifiedByName;
    reminder.updated_at = new Date().toISOString();
    return reminder;
  }

  toggleReminderSubscription(id: string, userId: string): boolean {
    const reminder = this.reminders.find((r) => r.id === id);
    if (!reminder) return false;
    reminder.user_subscribed = !reminder.user_subscribed;
    return !!reminder.user_subscribed;
  }

  getReminderHistory(reminderId: string): ReminderHistoryEntry[] {
    return this.reminderHistory.filter((h) => h.reminder_id === reminderId);
  }

  // IMPORTANT LINKS
  getLinks(): ImportantLink[] {
    const now = new Date();
    return [...this.links]
      .filter((l) => !l.expires_at || new Date(l.expires_at) >= now)
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return b.click_count - a.click_count;
      });
  }

  addLink(data: Omit<ImportantLink, "id" | "click_count" | "created_at">, actorId: string, actorName: string): ImportantLink {
    const newLink: ImportantLink = {
      ...data,
      id: `lnk-${Date.now()}`,
      title: sanitizeText(data.title),
      url: data.url.trim(),
      click_count: 0,
      created_by: actorId,
      creator_name: actorName,
      created_at: new Date().toISOString(),
    };
    this.links.push(newLink);
    return newLink;
  }

  trackLinkClick(id: string): boolean {
    const link = this.links.find((l) => l.id === id);
    if (link) {
      link.click_count += 1;
      return true;
    }
    return false;
  }

  incrementLinkClick(id: string): number {
    const link = this.links.find((l) => l.id === id);
    if (link) {
      link.click_count += 1;
      return link.click_count;
    }
    return 0;
  }

  archiveExpiredLinks(): number {
    const now = new Date();
    let archivedCount = 0;
    this.links.forEach((l) => {
      if (l.expires_at && new Date(l.expires_at) < now && l.status !== "archived") {
        l.status = "archived";
        archivedCount++;
      }
    });
    return archivedCount;
  }

  // COMMUNITY FACULTY & SUBJECT FEEDBACK THREADS
  getFeedbackThreads(voterId?: string): FeedbackThread[] {
    return [...this.feedbackThreads]
      .map((t) => {
        const userVote = voterId && t.voters ? t.voters[voterId] : null;
        return {
          id: t.id,
          subject_name: t.subject_name,
          faculty_name: t.faculty_name,
          title: t.title,
          review: t.review,
          rating: t.rating,
          author_pseudonym: t.author_pseudonym,
          upvotes: t.upvotes,
          downvotes: t.downvotes,
          voted: userVote,
          comments: t.comments,
          created_at: t.created_at,
        };
      })
      .sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes));
  }

  createFeedbackThread(
    data: { subject_name: string; faculty_name: string; title: string; review: string; rating?: number },
    authorPseudonym: string
  ): FeedbackThread {
    const newThread: FeedbackThreadRecord = {
      id: `fbt-${Date.now()}`,
      subject_name: sanitizeText(data.subject_name),
      faculty_name: sanitizeText(data.faculty_name),
      title: sanitizeText(data.title),
      review: sanitizeText(data.review),
      rating: data.rating,
      author_pseudonym: authorPseudonym,
      upvotes: 1,
      downvotes: 0,
      voters: {},
      comments: [],
      created_at: new Date().toISOString(),
    };
    this.feedbackThreads.push(newThread);
    return {
      ...newThread,
      voted: "up",
    };
  }

  voteFeedbackThread(threadId: string, voterId: string, direction: "up" | "down"): boolean {
    const thread = this.feedbackThreads.find((t) => t.id === threadId);
    if (!thread) return false;
    if (!thread.voters) thread.voters = {};

    const existing = thread.voters[voterId];
    if (existing === direction) {
      // Toggle off
      delete thread.voters[voterId];
      if (direction === "up") thread.upvotes = Math.max(0, thread.upvotes - 1);
      if (direction === "down") thread.downvotes = Math.max(0, thread.downvotes - 1);
      return true;
    }

    if (existing) {
      // Switch vote
      if (existing === "up") thread.upvotes = Math.max(0, thread.upvotes - 1);
      if (existing === "down") thread.downvotes = Math.max(0, thread.downvotes - 1);
    }

    thread.voters[voterId] = direction;
    if (direction === "up") thread.upvotes += 1;
    if (direction === "down") thread.downvotes += 1;
    return true;
  }

  addFeedbackComment(threadId: string, authorPseudonym: string, body: string): FeedbackComment | null {
    const thread = this.feedbackThreads.find((t) => t.id === threadId);
    if (!thread) return null;
    if (!thread.comments) thread.comments = [];

    const comment: FeedbackComment = {
      id: `fbc-${Date.now()}`,
      author_pseudonym: authorPseudonym,
      body: sanitizeText(body),
      created_at: new Date().toISOString(),
    };
    thread.comments.push(comment);
    return comment;
  }

  submitFeedback(
    submission: Partial<FeedbackSubmission>,
    userId: string
  ): { success: boolean; error?: string } {
    const courseId = submission.course_id || "";
    const facultyId = submission.faculty_id || "";
    const term = submission.term || "";

    const hash = computeFeedbackHash(userId, courseId, facultyId, term);
    const existing = this.legacyFeedbackSubmissions.find((s) => s.user_hash === hash);
    if (existing) {
      return { success: false, error: "You have already submitted feedback for this course/faculty" };
    }

    const newSub: FeedbackSubmission = {
      id: `fb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      course_id: courseId,
      faculty_id: facultyId,
      term,
      user_hash: hash,
      ratings: submission.ratings || {
        content_clarity: 5,
        pace: 4,
        engagement: 5,
        assessment_fairness: 4,
        practical_relevance: 5,
      },
      comment: submission.comment,
      submitted_at: new Date().toISOString(),
    };

    this.legacyFeedbackSubmissions.push(newSub);
    return { success: true };
  }

  getFacultyFeedbackSummary(courseId: string, facultyId: string, term: string): FeedbackSummary {
    const matches = this.legacyFeedbackSubmissions.filter(
      (s) => s.course_id === courseId && s.faculty_id === facultyId && s.term === term
    );

    const count = matches.length;
    if (count < 5) {
      return {
        course_id: courseId,
        faculty_id: facultyId,
        term,
        count,
        status: "insufficient_responses",
        message: `Feedback requires at least 5 student responses to reveal aggregated insights (currently ${count}/5).`,
      };
    }

    const total = matches.reduce(
      (acc, curr) => {
        const r = curr.ratings || {
          content_clarity: 5,
          pace: 4,
          engagement: 5,
          assessment_fairness: 4,
          practical_relevance: 5,
        };
        return {
          content_clarity: acc.content_clarity + r.content_clarity,
          pace: acc.pace + r.pace,
          engagement: acc.engagement + r.engagement,
          assessment_fairness: acc.assessment_fairness + r.assessment_fairness,
          practical_relevance: acc.practical_relevance + r.practical_relevance,
        };
      },
      {
        content_clarity: 0,
        pace: 0,
        engagement: 0,
        assessment_fairness: 0,
        practical_relevance: 0,
      }
    );

    const averages = {
      content_clarity: +(total.content_clarity / count).toFixed(1),
      pace: +(total.pace / count).toFixed(1),
      engagement: +(total.engagement / count).toFixed(1),
      assessment_fairness: +(total.assessment_fairness / count).toFixed(1),
      practical_relevance: +(total.practical_relevance / count).toFixed(1),
      overall: +(
        (total.content_clarity +
          total.pace +
          total.engagement +
          total.assessment_fairness +
          total.practical_relevance) /
        (count * 5)
      ).toFixed(1),
    };

    return {
      course_id: courseId,
      faculty_id: facultyId,
      term,
      count,
      status: "ready",
      averages,
    };
  }

  // CLASS SCHEDULE
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

  // ASSIGNMENTS
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
    if (!asg) return false;
    asg.user_status = status;
    return true;
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
    return true;
  }

  claimPartyItem(eventId: string, itemId: string, userId: string, userName: string): boolean {
    return true;
  }

  addPartyMessage(eventId: string, userId: string, userName: string, body: string): PartyMessage {
    return {
      id: `pmsg-${Date.now()}`,
      event_id: eventId,
      user_id: userId,
      user_name: userName,
      body: sanitizeText(body),
      created_at: new Date().toISOString(),
    };
  }

  // ANONYMOUS CHAT (24-Hour Rolling Purge)
  getChatMessages(myPseudonym?: string): ChatMessage[] {
    const cutoff = new Date(Date.now() - 24 * 3600000);
    const persisted = loadPersistedChatMessages();
    if (persisted.length > 0) {
      const map = new Map<string, ChatMessage>();
      this.chatMessages.forEach((m) => map.set(m.id, m));
      persisted.forEach((m) => map.set(m.id, m));
      this.chatMessages = Array.from(map.values());
    }

    this.purgeExpiredChatMessages();

    return this.chatMessages
      .filter((m) => new Date(m.created_at) >= cutoff)
      .map((m) => {
        const { session_token, ...safeMsg } = m;
        return {
          ...safeMsg,
          is_own: myPseudonym ? m.pseudonym === myPseudonym : false,
        };
      })
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  replaceChatMessages(messages: ChatMessage[]): void {
    this.chatMessages = [...messages];
    persistChatMessages(this.chatMessages);
  }

  syncChatFromExternal(messages: ChatMessage[]): void {
    if (!Array.isArray(messages) || messages.length === 0) return;
    const map = new Map<string, ChatMessage>();
    this.chatMessages.forEach((m) => map.set(m.id, m));
    messages.forEach((m) => map.set(m.id, m));
    this.chatMessages = Array.from(map.values());
    persistChatMessages(this.chatMessages);
  }

  postChatMessage(body: string, authorPseudonym: string, sessionToken?: string, customId?: string): ChatMessage {
    const msg: ChatMessage = {
      id: customId || `cmsg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      room_id: "batch-lounge",
      pseudonym: authorPseudonym,
      body: sanitizeText(body),
      session_token: sessionToken || `sess-${Date.now()}`,
      reactions: {},
      created_at: new Date().toISOString(),
      is_own: true,
    };
    const idx = this.chatMessages.findIndex((m) => m.id === msg.id);
    if (idx >= 0) {
      this.chatMessages[idx] = msg;
    } else {
      this.chatMessages.push(msg);
    }
    persistChatMessages(this.chatMessages);
    return msg;
  }

  purgeExpiredChatMessages(): number {
    const cutoff = new Date(Date.now() - 24 * 3600000);
    const beforeCount = this.chatMessages.length;
    this.chatMessages = this.chatMessages.filter(
      (m) => new Date(m.created_at) >= cutoff
    );
    if (beforeCount !== this.chatMessages.length) {
      persistChatMessages(this.chatMessages);
    }
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
