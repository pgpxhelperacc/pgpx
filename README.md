# PGPx Student Portal (pgpx.iimrohtak.in)

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%2B%20RLS-3ecf8e?logo=supabase)](https://supabase.com/)
[![Vitest](https://img.shields.io/badge/Tests-13%20Passed-brightgreen?logo=vitest)](https://vitest.dev/)
[![OWASP](https://img.shields.io/badge/Security-OWASP%20Compliant-purple)](https://owasp.org/)

Unified mobile-first web portal for **PGPx students of the Indian Institute of Management Rohtak (IIM Rohtak)**. Designed to replace scattered WhatsApp groups and Google Sheets with a single, ultra-fast daily dashboard to track deadlines, schedules, resources, anonymous faculty feedback, and batch social events.

---

## 1. System Architecture

```
                                 ┌────────────────────────────────────────────────┐
                                 │            Vercel Edge & Frontend              │
                                 │         Next.js 14 App Router + PWA            │
                                 │  (Dark Theme #000, Geist Font, Cmd+K Palette)   │
                                 └──────┬───────────────────────────────────┬─────┘
                                        │                                   │
                           HTTPS / API  │                       Realtime    │ WebSocket
                                        ▼                                   ▼
┌───────────────────────────────────────────────┐       ┌─────────────────────────────────┐
│              Next.js API Routes               │       │     Supabase Cloud Services     │
│  - Strict Domain Auth (@iimrohtak.ac.in)      │◄─────►│  - Postgres DB with Row-Level  │
│  - One-Way Feedback Hash (Zero User ID Leak)  │       │    Security (RLS) on all tables │
│  - 24h Rotating Pseudonym Generator           │       │  - Realtime WebSocket Channels   │
│  - RFC 5545 Subscribable .ICS Feed            │       │  - pg_cron 24h Hard Deletion     │
└───────────────────────┬───────────────────────┘       └────────────────┬────────────────┘
                        │                                                │
                        │ Internal Auth / CRON_SECRET                    │ Database Queries
                        ▼                                                ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                Render Background Worker Service                         │
│  - Deadline Scanner: Scans assignments & reminders every minute; dispatches Push & Email│
│  - 24h Anonymous Chat Purger: True hard-delete of expired messages (every 5 minutes)    │
│  - Auto-Archival: Flips expired links to archived status                                │
│  - Healthcheck HTTP Server: GET /health for uptime monitoring                           │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Modules & Acceptance Guarantees

### 2.1 Domain-Restricted Authentication & Roles
- **Institute Domain Enforcement**: Only `@iimrohtak.ac.in` email addresses are permitted. External email providers (`gmail.com`, `outlook.com`, etc.) are rejected with an explicit security warning.
- **Passwordless Flow**: Magic Link / OTP authentication.
- **Roles**: `student`, `cr` (Class Representative / Moderator), `admin` (Academic Office).
- **Allowlist Table**: Pre-configured roll numbers and batch details for PGPx06.

### 2.2 Important Dates & Reminders
- **Crowdsourced & CR-Verified**: Any logged-in student can post an upcoming quiz date, exam window, or submission deadline.
- **Verification Badge**: CRs can verify entries (`is_verified`) to mitigate false dates.
- **Edit History & Audit Trail**: To prevent silent date tampering, every edit creates a diff record in `reminder_history` tracking who changed what and when.
- **Personal Subscriptions**: "Remind me" toggle with push/email notifications 1 day / 1 hour before.
- **Subscribable Calendar Feed**: Download or subscribe to live `.ics` feed at `/api/calendar/feed.ics` for Google Calendar and Apple Calendar.

### 2.3 Important Links Directory
- Resource cards organized by category (`Course material`, `Form`, `Registration`, `Placement`, `Admin`, `Tools`).
- Auto-highlights links expiring within 72 hours; automatically archives expired links.
- Tracks real-time click counts.
- Sticky pinned resources for essential campus portals (Moodle, HBR Coursepack, Bloomberg Terminal Booking).

### 2.4 Faculty Feedback (Strict Anonymity Safeguards)
- 1–5 structured rating matrix:
  1. Content clarity & rigor
  2. Class pacing
  3. Student engagement & case discussion
  4. Assessment fairness
  5. Practical & industry relevance
- **Zero User Identifiers**: Feedback records store NO user ID. A cryptographic one-way hash:
  $$\text{HMAC-SHA256}(\text{userId} : \text{courseId} : \text{facultyId} : \text{term}, \text{PEPPER})$$
  enforces one submission per student per module without linking identity to feedback.
- **5-Response Anonymity Threshold**: Aggregated scores and comments remain strictly hidden until at least 5 batch submissions exist, ensuring individual answers cannot be reverse-engineered.
- Moderation filter and report button for abusive comments. Admin export to CSV.

### 2.5 Anonymous Batch Chat (24-Hour Ephemeral Purge)
- **Rotating Daily Pseudonyms**: Pseudonyms (e.g., `Silent Falcon 42`, `Neon Tiger 88`) rotate every UTC midnight based on user hash and date salt. No real names or roll numbers are revealed to classmates.
- **24-Hour True Hard Purge**: Messages older than 24 hours are permanently deleted (`DELETE FROM chat_messages`) by the Render background worker and database functions.
- Safety: Emoji reactions, profanity heuristics, rate limiting, and report button for CR review.
- Clear community disclaimer: *"Anonymity cannot prevent device screenshots. Maintain institute community rules."*

### 2.6 Class Schedule & Whole-Semester Roadmap
- Daily and weekly lecture schedule showing course, faculty, room, and timings.
- **First-Class Change Tracking**: Reschedules, room changes, and cancellations display high-visibility badges and notification notes.
- **"Next Class" Widget**: Live countdown ring on the home dashboard showing time remaining until the next lecture.
- **Whole-Semester Agenda**: Calendar overview covering term boundaries, mid-term/end-term examination slots, consulting project weeks, and holiday recesses.

### 2.7 Upcoming Assignments & Deadline Alerts
- Assignment tracker with course weightage (e.g., 25% of grade), deliverable type (Individual / Group), and direct submission portal link.
- Private personal progress checkboxes (`To Do`, `In Progress`, `Done`).
- Automatic deadline alerts dispatched at configurable offsets (**3 days, 1 day, 3 hours, 30 minutes before**) via Web Push and email.

### 2.8 Party & Socials Hub
- Batch-only social planning hub for dinners, house parties, trips, and weekend comedy nights.
- RSVP tracking (`Going`, `Maybe`, `Can't`) with live headcount.
- Date and venue voting polls when logistics are undecided.
- Contribution & split tracker with budget per head and claimable supplies checklist (e.g., speaker, ice boxes, snacks).
- **Carpool Coordination**: "Need a Ride / Carpool" board to prevent drunk driving and coordinate shared cabs between Rohtak and Delhi NCR.

---

## 3. Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 14 (App Router), React 18, TypeScript |
| **Styling & UI** | Tailwind CSS, Vercel Dark Theme Tokens, Framer Motion, Lucide Icons |
| **Command Palette** | Custom Cmd+K modal with quick navigation and actions |
| **Database & Auth** | Supabase (PostgreSQL, Row Level Security, Realtime, Triggers) |
| **Local Store** | Dual-mode in-memory & JSON mock store with preloaded IIMR seed data |
| **Background Worker** | Node.js Worker Service (`worker/service.mjs`) for Render |
| **Alert Delivery** | Web Push API (VAPID) + Resend Email API |
| **Calendar Standard** | RFC 5545 `.ics` iCalendar feed generator |
| **Testing** | Vitest (Unit & Acceptance) + Playwright (Cross-Browser E2E) |

---

## 4. Local Development Quickstart

The application includes an integrated local data engine preloaded with realistic IIM Rohtak courses, schedules, and seed data so you can run and test everything locally **immediately** without remote credentials.

### Prerequisites
- Node.js 18+ (tested on v24)
- npm 9+

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

### Step 3: Run Vitest Acceptance Tests
Verify the core acceptance criteria:
```bash
npm test
```
All 13 acceptance tests will pass:
```
 ✓ tests/acceptance.test.ts (13 tests) 12ms
   ✓ Acceptance Criterion 1: Domain-Restricted Login (@iimrohtak.ac.in)
   ✓ Acceptance Criterion 2: Reminder Permissions & Edit History
   ✓ Acceptance Criterion 3: Faculty Feedback Anonymity & 5-Response Threshold
   ✓ Acceptance Criterion 4: Anonymous Chat 24-Hour Purge & Rotating Pseudonyms
   ✓ Acceptance Criterion 5: OWASP Input Sanitization
```

### Step 4: Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Step 5: Test Personas & Role Switcher
In the top-right header, click on the profile badge to switch between test personas with one click:
- **Rahul Verma** (Student, `PGPX06012`)
- **Ananya Sharma** (Class Representative / Moderator, `PGPX06005`)
- **PGPx Academic Office** (Administrator, `ADMIN001`)

---

## 5. Background Worker Service (Render Deployment)

The background worker in `worker/service.mjs` handles asynchronous cron jobs and deadline alerts:

### Start the Worker Locally
```bash
npm run worker
```
The worker starts on port 4000:
- `GET /health`: Uptime and liveness check probe for Render.
- `POST /trigger-purge`: Manual trigger for 24-hour chat purge with `CRON_SECRET`.
- Scans deadlines every 60 seconds; purges expired chat messages every 5 minutes.

### Render Setup
1. Create a **Background Worker** (or Web Service) on Render pointing to your repository.
2. Build Command: `npm install`
3. Start Command: `npm run worker`
4. Set Environment Variables:
   - `NEXT_PUBLIC_SITE_URL`: Your deployed frontend URL (e.g., `https://pgpx.iimrohtak.in`)
   - `CRON_SECRET`: Match the secret in your frontend `.env`
   - `WORKER_PORT`: `4000`

---

## 6. Database Migrations & Supabase Deployment

Full SQL migrations with strict Row Level Security policies are located at:
`supabase/migrations/20261010000000_init_pgpx_schema.sql`

Seed data is located at:
`supabase/seed.sql`

### Applying Migrations to Supabase:
1. In your Supabase Dashboard, navigate to the **SQL Editor**.
2. Run `supabase/migrations/20261010000000_init_pgpx_schema.sql`.
3. Run `supabase/seed.sql` to populate initial faculty, courses, allowlist, and calendar dates.
4. Enable `pg_cron` extension in Supabase to run rolling purge:
   ```sql
   SELECT cron.schedule('purge-chat-every-5-min', '*/5 * * * *', 'SELECT public.purge_expired_chat_messages();');
   ```

---

## 7. Security & OWASP Compliance

1. **Content Security Policy (CSP)**: Strict headers configured in `next.config.mjs` preventing inline script execution from unauthorized origins.
2. **Clickjacking Defense**: `X-Frame-Options: DENY` and `frame-ancestors 'none'`.
3. **MIME Sniffing Prevention**: `X-Content-Type-Options: nosniff`.
4. **HSTS**: `max-age=63072000; includeSubDomains; preload`.
5. **Input Sanitization**: Strip null bytes, script tags, event handlers (`onerror`, `onload`), and javascript URIs.
6. **No Client Fingerprinting**: Pseudonyms and feedback hashes are computed server-side using cryptographic peppers.

---

## 8. Custom Domain & DNS Configuration

For custom domain `pgpx.iimrohtak.in`:
1. Request the IIM Rohtak IT / Network Administrator to add a DNS record:
   - **Type**: `CNAME`
   - **Host / Name**: `pgpx`
   - **Target / Value**: `cname.vercel-dns.com`
2. In the Vercel Project Dashboard, navigate to **Settings > Domains** and add `pgpx.iimrohtak.in`.
3. Vercel will automatically provision SSL/TLS certificates via Let's Encrypt.
