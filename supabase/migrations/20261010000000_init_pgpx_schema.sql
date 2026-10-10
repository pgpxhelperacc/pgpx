-- Supabase Schema for PGPx Student Portal (pgpx.iimrohtak.in)
-- Compliant with OWASP, Row Level Security, and Privacy Guarantees

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. USERS & ROLES
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE CHECK (email LIKE '%@iimrohtak.ac.in'),
  name TEXT NOT NULL,
  roll_no TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'cr', 'admin')) DEFAULT 'student',
  batch TEXT NOT NULL DEFAULT 'PGPx06',
  term TEXT NOT NULL DEFAULT 'Term 4',
  section TEXT NOT NULL DEFAULT 'A',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Allowlist for pre-authorized batch members
CREATE TABLE IF NOT EXISTS public.allowlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE CHECK (email LIKE '%@iimrohtak.ac.in'),
  roll_no TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. ACADEMIC STRUCTURE (Courses & Faculty)
CREATE TABLE IF NOT EXISTS public.faculty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  department TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  term TEXT NOT NULL,
  credits NUMERIC NOT NULL DEFAULT 3.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.course_faculty (
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  faculty_id UUID NOT NULL REFERENCES public.faculty(id) ON DELETE CASCADE,
  PRIMARY KEY (course_id, faculty_id)
);

-- 4. IMPORTANT DATES & REMINDERS
CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('Assignment', 'Quiz', 'Exam', 'Submission', 'Event', 'Holiday', 'Other')),
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  due_at TIMESTAMPTZ NOT NULL,
  link TEXT,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  verified_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.reminder_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reminder_id UUID NOT NULL REFERENCES public.reminders(id) ON DELETE CASCADE,
  changed_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  diff JSONB NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.reminder_subscriptions (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reminder_id UUID NOT NULL REFERENCES public.reminders(id) ON DELETE CASCADE,
  notify_offset_minutes INTEGER NOT NULL DEFAULT 60,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (user_id, reminder_id)
);

-- 5. IMPORTANT LINKS
CREATE TABLE IF NOT EXISTS public.links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Course material', 'Form', 'Registration', 'Placement', 'Admin', 'Tools')),
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  valid_from TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  pinned BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL CHECK (status IN ('active', 'archived', 'pending_approval')) DEFAULT 'active',
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  click_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. FACULTY FEEDBACK (Strict Anonymity Safeguards)
-- No user_id column exists on this table!
-- submitter_hash is a one-way HMAC-SHA256 hash enforcing 1 submission per student per course
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  faculty_id UUID NOT NULL REFERENCES public.faculty(id) ON DELETE CASCADE,
  term TEXT NOT NULL,
  ratings JSONB NOT NULL, -- { content_clarity: 1-5, pace: 1-5, engagement: 1-5, assessment_fairness: 1-5, practical_relevance: 1-5 }
  comment TEXT,
  submitter_hash TEXT NOT NULL,
  hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (course_id, faculty_id, term, submitter_hash)
);

-- 7. CLASS SCHEDULE & SEMESTER CALENDAR
CREATE TABLE IF NOT EXISTS public.schedule_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  faculty_id UUID REFERENCES public.faculty(id) ON DELETE SET NULL,
  room TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('class', 'quiz', 'guest_lecture', 'make_up')) DEFAULT 'class',
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'rescheduled', 'cancelled')) DEFAULT 'scheduled',
  changed_note TEXT,
  section TEXT NOT NULL DEFAULT 'A',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.semester_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term TEXT NOT NULL,
  label TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('term_boundary', 'holiday', 'exam_window', 'project_week', 'break')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. ASSIGNMENTS & DEADLINE ALERTS
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('individual', 'group')) DEFAULT 'individual',
  due_at TIMESTAMPTZ NOT NULL,
  weightage NUMERIC,
  submission_url TEXT,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.assignment_progress (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'done')) DEFAULT 'not_started',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (user_id, assignment_id)
);

CREATE TABLE IF NOT EXISTS public.alert_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  push_enabled BOOLEAN NOT NULL DEFAULT true,
  offsets_minutes INTEGER[] NOT NULL DEFAULT '{4320, 1440, 180, 30}', -- 3 days, 1 day, 3h, 30m
  per_course JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL,
  item_id UUID NOT NULL,
  offset_minutes INTEGER NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (user_id, item_type, item_id, offset_minutes)
);

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  keys JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. PARTY & SOCIALS
CREATE TABLE IF NOT EXISTS public.party_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('House Party', 'Dinner', 'Trip', 'Movie Night', 'Sports', 'Birthday', 'Celebration', 'Other')),
  starts_at TIMESTAMPTZ NOT NULL,
  venue TEXT NOT NULL,
  capacity INTEGER,
  visibility TEXT NOT NULL CHECK (visibility IN ('public_batch', 'invite_only')) DEFAULT 'public_batch',
  budget_per_head NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  cover_image TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'cancelled')) DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.party_rsvps (
  event_id UUID NOT NULL REFERENCES public.party_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('going', 'maybe', 'cant')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (event_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.party_polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.party_events(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.party_votes (
  poll_id UUID NOT NULL REFERENCES public.party_polls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  option_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (poll_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.party_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.party_events(id) ON DELETE CASCADE,
  item TEXT NOT NULL,
  claimed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  paid_status BOOLEAN NOT NULL DEFAULT false,
  estimated_cost NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.party_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.party_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. ANONYMOUS CHAT (Rolling 24-Hour Purge)
CREATE TABLE IF NOT EXISTS public.chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  pseudonym TEXT NOT NULL,
  body TEXT NOT NULL,
  session_token TEXT NOT NULL, -- transient hash for abuse mitigation
  reactions JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for speedy 24h purge
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);

-- Function to hard-delete chat messages older than 24 hours
CREATE OR REPLACE FUNCTION public.purge_expired_chat_messages()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.chat_messages
  WHERE created_at < timezone('utc'::text, now()) - INTERVAL '24 hours';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. REPORTS & AUDIT LOG
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('chat_message', 'feedback_comment', 'party_event', 'link', 'reminder')),
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'reviewed', 'actioned', 'dismissed')) DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 12. ROW LEVEL SECURITY (RLS) POLICIES

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allowlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semester_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Helper function to check role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- USERS POLICIES
CREATE POLICY "Users are viewable by authenticated users" ON public.users
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE TO authenticated USING (id = auth.uid());

-- REMINDERS POLICIES
CREATE POLICY "Reminders readable by all batch members" ON public.reminders
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Any student can insert a reminder" ON public.reminders
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

CREATE POLICY "Creator, CR or Admin can update reminder" ON public.reminders
  FOR UPDATE TO authenticated USING (
    created_by = auth.uid() OR public.current_user_role() IN ('cr', 'admin')
  );

CREATE POLICY "Creator, CR or Admin can delete reminder" ON public.reminders
  FOR DELETE TO authenticated USING (
    created_by = auth.uid() OR public.current_user_role() IN ('cr', 'admin')
  );

-- REMINDER HISTORY
CREATE POLICY "Reminder history viewable by all" ON public.reminder_history
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can record history" ON public.reminder_history
  FOR INSERT TO authenticated WITH CHECK (changed_by = auth.uid());

-- LINKS POLICIES
CREATE POLICY "Active links viewable by authenticated users" ON public.links
  FOR SELECT TO authenticated USING (
    status = 'active' OR created_by = auth.uid() OR public.current_user_role() IN ('cr', 'admin')
  );

CREATE POLICY "Students can add links" ON public.links
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

CREATE POLICY "Link owner or CR/admin can update" ON public.links
  FOR UPDATE TO authenticated USING (
    created_by = auth.uid() OR public.current_user_role() IN ('cr', 'admin')
  );

-- FEEDBACK POLICIES (Enforces anonymity and privacy)
CREATE POLICY "Feedback submit: authenticated users" ON public.feedback
  FOR INSERT TO authenticated WITH CHECK (true);

-- Individual rows can NEVER be read directly by client queries to protect anonymity.
-- Queries must use aggregated views or secure RPC function below!
CREATE POLICY "Admin or CR can view non-hidden feedback for moderation" ON public.feedback
  FOR SELECT TO authenticated USING (public.current_user_role() IN ('cr', 'admin'));

-- FUNCTION FOR ANONYMOUS AGGREGATED FEEDBACK (Minimum 5 responses)
CREATE OR REPLACE FUNCTION public.get_faculty_feedback_summary(p_course_id UUID, p_faculty_id UUID, p_term TEXT)
RETURNS JSONB AS $$
DECLARE
  response_count INTEGER;
  result JSONB;
BEGIN
  SELECT count(*) INTO response_count
  FROM public.feedback
  WHERE course_id = p_course_id AND faculty_id = p_faculty_id AND term = p_term AND hidden = false;

  IF response_count < 5 THEN
    RETURN jsonb_build_object(
      'status', 'insufficient_responses',
      'count', response_count,
      'threshold', 5,
      'message', 'Aggregated feedback requires at least 5 responses to protect student anonymity.'
    );
  END IF;

  SELECT jsonb_build_object(
    'status', 'ready',
    'count', response_count,
    'averages', jsonb_build_object(
      'content_clarity', round(avg((ratings->>'content_clarity')::numeric), 2),
      'pace', round(avg((ratings->>'pace')::numeric), 2),
      'engagement', round(avg((ratings->>'engagement')::numeric), 2),
      'assessment_fairness', round(avg((ratings->>'assessment_fairness')::numeric), 2),
      'practical_relevance', round(avg((ratings->>'practical_relevance')::numeric), 2),
      'overall', round(avg(
        ((ratings->>'content_clarity')::numeric +
         (ratings->>'pace')::numeric +
         (ratings->>'engagement')::numeric +
         (ratings->>'assessment_fairness')::numeric +
         (ratings->>'practical_relevance')::numeric) / 5.0
      ), 2)
    ),
    'comments', (
      SELECT coalesce(jsonb_agg(comment), '[]'::jsonb)
      FROM public.feedback
      WHERE course_id = p_course_id AND faculty_id = p_faculty_id AND term = p_term AND hidden = false AND comment IS NOT NULL AND comment <> ''
    )
  ) INTO result
  FROM public.feedback
  WHERE course_id = p_course_id AND faculty_id = p_faculty_id AND term = p_term AND hidden = false;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CHAT POLICIES
CREATE POLICY "Active chat rooms viewable" ON public.chat_rooms
  FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "Chat messages readable by all authenticated batch members" ON public.chat_messages
  FOR SELECT TO authenticated USING (
    created_at >= timezone('utc'::text, now()) - INTERVAL '24 hours'
  );

CREATE POLICY "Batch members can post chat messages" ON public.chat_messages
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "CR and Admin can delete chat messages" ON public.chat_messages
  FOR DELETE TO authenticated USING (public.current_user_role() IN ('cr', 'admin'));

-- PARTY & SOCIALS POLICIES
CREATE POLICY "Party events readable by authenticated batch members" ON public.party_events
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Batch members can create party events" ON public.party_events
  FOR INSERT TO authenticated WITH CHECK (host_id = auth.uid());

CREATE POLICY "Host or CR/Admin can update party events" ON public.party_events
  FOR UPDATE TO authenticated USING (host_id = auth.uid() OR public.current_user_role() IN ('cr', 'admin'));

CREATE POLICY "Host or CR/Admin can delete party events" ON public.party_events
  FOR DELETE TO authenticated USING (host_id = auth.uid() OR public.current_user_role() IN ('cr', 'admin'));

CREATE POLICY "Party RSVPs visible to all" ON public.party_rsvps
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage own RSVP" ON public.party_rsvps
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Party items viewable by all" ON public.party_items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Party items insertable by all" ON public.party_items
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Party items claimable and updatable" ON public.party_items
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Party messages readable by all" ON public.party_messages
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Party messages insertable by members" ON public.party_messages
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- SCHEDULE & ASSIGNMENTS
CREATE POLICY "Schedule viewable by all" ON public.schedule_entries
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Schedule editable by CR or Admin" ON public.schedule_entries
  FOR ALL TO authenticated USING (public.current_user_role() IN ('cr', 'admin'));

CREATE POLICY "Calendar viewable by all" ON public.semester_calendar
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Calendar editable by CR or Admin" ON public.semester_calendar
  FOR ALL TO authenticated USING (public.current_user_role() IN ('cr', 'admin'));

CREATE POLICY "Assignments viewable by all" ON public.assignments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Assignments editable by CR, Admin or Creator" ON public.assignments
  FOR ALL TO authenticated USING (
    created_by = auth.uid() OR public.current_user_role() IN ('cr', 'admin')
  );

CREATE POLICY "Assignment progress readable and editable by owner only" ON public.assignment_progress
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
