export type UserRole = "student" | "cr" | "admin";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  roll_no: string;
  role: UserRole;
  batch: string;
  term: string;
  section: string;
  created_at?: string;
}

export interface AllowlistEntry {
  id: string;
  email: string;
  roll_no: string;
  name: string;
  role: UserRole;
}

export interface Faculty {
  id: string;
  name: string;
  email?: string;
  department?: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  term: string;
  credits: number;
  faculty_ids?: string[];
  faculty?: Faculty[];
}

export type ReminderCategory =
  | "Assignment"
  | "Quiz"
  | "Exam"
  | "Submission"
  | "Event"
  | "Holiday"
  | "Other";

export interface Reminder {
  id: string;
  title: string;
  description?: string;
  category: ReminderCategory;
  course_id?: string;
  course?: Course;
  due_at: string;
  link?: string;
  created_by: string;
  creator_name?: string;
  verified_by?: string;
  verified_by_name?: string;
  is_verified?: boolean;
  user_subscribed?: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReminderHistoryEntry {
  id: string;
  reminder_id: string;
  changed_by: string;
  changed_by_name?: string;
  diff: {
    field: string;
    old_value: any;
    new_value: any;
  }[];
  changed_at: string;
}

export type LinkCategory =
  | "Course material"
  | "Form"
  | "Registration"
  | "Placement"
  | "Admin"
  | "Tools";

export interface ImportantLink {
  id: string;
  title: string;
  url: string;
  category: LinkCategory;
  course_id?: string;
  course_name?: string;
  valid_from?: string;
  expires_at?: string;
  pinned: boolean;
  status: "active" | "archived" | "pending_approval";
  created_by: string;
  creator_name?: string;
  click_count: number;
  created_at: string;
}

export interface FeedbackRatings {
  content_clarity: number; // 1 to 5
  pace: number;
  engagement: number;
  assessment_fairness: number;
  practical_relevance: number;
}

export interface FeedbackSubmission {
  id?: string;
  course_id: string;
  faculty_id: string;
  term: string;
  ratings: FeedbackRatings;
  comment?: string;
}

export interface FeedbackSummary {
  status: "ready" | "insufficient_responses";
  count: number;
  threshold: number;
  message?: string;
  averages?: {
    content_clarity: number;
    pace: number;
    engagement: number;
    assessment_fairness: number;
    practical_relevance: number;
    overall: number;
  };
  comments?: string[];
}

export type ScheduleSessionType = "class" | "quiz" | "guest_lecture" | "make_up";
export type ScheduleStatus = "scheduled" | "rescheduled" | "cancelled";

export interface ScheduleEntry {
  id: string;
  course_id: string;
  course_name: string;
  course_code: string;
  faculty_id?: string;
  faculty_name?: string;
  room: string;
  starts_at: string;
  ends_at: string;
  type: ScheduleSessionType;
  status: ScheduleStatus;
  changed_note?: string;
  section: string;
}

export type SemesterKind =
  | "term_boundary"
  | "holiday"
  | "exam_window"
  | "project_week"
  | "break";

export interface SemesterCalendarItem {
  id: string;
  term: string;
  label: string;
  kind: SemesterKind;
  start_date: string;
  end_date: string;
  notes?: string;
}

export interface Assignment {
  id: string;
  course_id: string;
  course_code: string;
  course_name: string;
  title: string;
  description?: string;
  type: "individual" | "group";
  due_at: string;
  weightage?: number;
  submission_url?: string;
  created_by: string;
  creator_name?: string;
  user_status?: "not_started" | "in_progress" | "done";
}

export interface AlertPreferences {
  user_id: string;
  email_enabled: boolean;
  push_enabled: boolean;
  offsets_minutes: number[]; // e.g. [4320, 1440, 180, 30]
  per_course: Record<string, boolean>;
}

export type PartyCategory =
  | "House Party"
  | "Dinner"
  | "Trip"
  | "Movie Night"
  | "Sports"
  | "Birthday"
  | "Celebration"
  | "Other";

export type PartyRSVPStatus = "going" | "maybe" | "cant";

export interface PartyRSVP {
  user_id: string;
  user_name: string;
  status: PartyRSVPStatus;
}

export interface PartyPollOption {
  id: string;
  text: string;
  vote_count: number;
}

export interface PartyPoll {
  id: string;
  event_id: string;
  question: string;
  options: PartyPollOption[];
  user_voted_option_id?: string;
}

export interface PartyChecklistItem {
  id: string;
  event_id: string;
  item: string;
  claimed_by?: string;
  claimed_by_name?: string;
  paid_status: boolean;
  estimated_cost: number;
}

export interface PartyMessage {
  id: string;
  event_id: string;
  user_id: string;
  user_name: string;
  body: string;
  created_at: string;
}

export interface PartyEvent {
  id: string;
  host_id: string;
  host_name: string;
  title: string;
  category: PartyCategory;
  starts_at: string;
  venue: string;
  capacity?: number;
  visibility: "public_batch" | "invite_only";
  budget_per_head: number;
  description?: string;
  cover_image?: string;
  status: "active" | "completed" | "cancelled";
  rsvps: PartyRSVP[];
  user_rsvp?: PartyRSVPStatus;
  headcount: {
    going: number;
    maybe: number;
    cant: number;
  };
  polls?: PartyPoll[];
  checklist?: PartyChecklistItem[];
  messages?: PartyMessage[];
  created_at: string;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  pseudonym: string;
  body: string;
  session_token?: string; // stripped before sending to clients
  reactions: Record<string, number>;
  created_at: string;
  is_own?: boolean;
}

export interface ReportItem {
  id: string;
  reporter_id: string;
  target_type: "chat_message" | "feedback_comment" | "party_event" | "link" | "reminder";
  target_id: string;
  reason: string;
  status: "pending" | "reviewed" | "actioned" | "dismissed";
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  actor_id?: string;
  actor_name?: string;
  action: string;
  target: string;
  metadata?: Record<string, any>;
  created_at: string;
}
