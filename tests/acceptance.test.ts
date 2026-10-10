import { describe, it, expect, beforeEach } from "vitest";
import { isValidInstituteEmail, sanitizeText, computeFeedbackHash, generateDailyPseudonym } from "../src/lib/security";
import { db } from "../src/lib/db";

describe("Acceptance Criterion 1: Domain-Restricted Login", () => {
  it("allows valid @iimrohtak.ac.in email addresses", () => {
    expect(isValidInstituteEmail("rahul.v24@iimrohtak.ac.in")).toBe(true);
    expect(isValidInstituteEmail("ananya.s24@iimrohtak.ac.in")).toBe(true);
    expect(isValidInstituteEmail("PGPX.ADMIN@IIMROHTAK.AC.IN")).toBe(true);
  });

  it("strictly rejects external email domains (gmail, outlook, personal, other colleges)", () => {
    expect(isValidInstituteEmail("student@gmail.com")).toBe(false);
    expect(isValidInstituteEmail("hacker@outlook.com")).toBe(false);
    expect(isValidInstituteEmail("user@iimahd.ernet.in")).toBe(false);
    expect(isValidInstituteEmail("fake@iimrohtak.in")).toBe(false); // must be iimrohtak.ac.in
    expect(isValidInstituteEmail("")).toBe(false);
    expect(isValidInstituteEmail(null as any)).toBe(false);
  });
});

describe("Acceptance Criterion 2: Reminder Permissions & Edit History", () => {
  it("allows any logged-in student to create a reminder", () => {
    const studentReminder = db.addReminder(
      {
        title: "Mid-Term Review Session",
        category: "Quiz",
        due_at: new Date(Date.now() + 86400000).toISOString(),
        created_by: "u-rohan",
      },
      "u-rohan",
      "Rohan Desai"
    );

    expect(studentReminder.id).toBeDefined();
    expect(studentReminder.created_by).toBe("u-rohan");
    expect(studentReminder.title).toBe("Mid-Term Review Session");
  });

  it("allows creator to edit their own reminder and records edit history", () => {
    const reminder = db.addReminder(
      {
        title: "Study Group Meeting",
        category: "Other",
        due_at: new Date(Date.now() + 86400000).toISOString(),
        created_by: "u-rohan",
      },
      "u-rohan",
      "Rohan Desai"
    );

    const updateResult = db.updateReminder(
      reminder.id,
      { title: "Study Group Meeting (Updated Room 204)" },
      "u-rohan",
      "Rohan Desai",
      "student"
    );

    expect(updateResult.success).toBe(true);
    expect(updateResult.reminder?.title).toBe("Study Group Meeting (Updated Room 204)");

    const history = db.getReminderHistory(reminder.id);
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].diff[0].field).toBe("title");
  });

  it("blocks unauthorized students from editing someone else's reminder", () => {
    const reminder = db.addReminder(
      {
        title: "Rahul's Group Assignment",
        category: "Assignment",
        due_at: new Date(Date.now() + 86400000).toISOString(),
        created_by: "u-rahul",
      },
      "u-rahul",
      "Rahul Verma"
    );

    // Another student tries to edit it
    const unauthorizedResult = db.updateReminder(
      reminder.id,
      { title: "Tampered Title" },
      "u-priya",
      "Priya Patel",
      "student"
    );

    expect(unauthorizedResult.success).toBe(false);
    expect(unauthorizedResult.error).toContain("Forbidden");
  });

  it("allows CR or Admin to edit or delete any reminder", () => {
    const reminder = db.addReminder(
      {
        title: "Unverified Quiz Date",
        category: "Quiz",
        due_at: new Date(Date.now() + 86400000).toISOString(),
        created_by: "u-priya",
      },
      "u-priya",
      "Priya Patel"
    );

    // CR edits it
    const crResult = db.updateReminder(
      reminder.id,
      { title: "Verified Quiz Date: Officially Scheduled" },
      "u-ananya",
      "Ananya Sharma (CR)",
      "cr"
    );

    expect(crResult.success).toBe(true);
    expect(crResult.reminder?.title).toBe("Verified Quiz Date: Officially Scheduled");
  });
});

describe("Acceptance Criterion 3: Faculty Feedback Anonymity & Safeguards", () => {
  it("generates deterministic one-way hash preventing multiple submissions while dissociating user id", () => {
    const hash1 = computeFeedbackHash("user-123", "c-1", "fac-1", "Term 4");
    const hash2 = computeFeedbackHash("user-123", "c-1", "fac-1", "Term 4");
    const hashOther = computeFeedbackHash("user-456", "c-1", "fac-1", "Term 4");

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hashOther);
    // Hash is 64 hex characters (SHA256)
    expect(hash1.length).toBe(64);
  });

  it("blocks double submissions from the same student for the same course/faculty", () => {
    const submission = {
      course_id: "c-3",
      faculty_id: "fac-3",
      term: "Term 4",
      ratings: { content_clarity: 5, pace: 4, engagement: 5, assessment_fairness: 4, practical_relevance: 5 },
      comment: "Great supply chain cases.",
    };

    const firstSubmit = db.submitFeedback(submission, "u-student-test-99");
    expect(firstSubmit.success).toBe(true);

    const secondSubmit = db.submitFeedback(submission, "u-student-test-99");
    expect(secondSubmit.success).toBe(false);
    expect(secondSubmit.error).toContain("already submitted");
  });

  it("hides aggregated feedback summary when responses are fewer than 5 (privacy threshold)", () => {
    const summary = db.getFacultyFeedbackSummary("c-2", "fac-2", "Term 4");
    expect(summary.status).toBe("insufficient_responses");
    expect(summary.count).toBeLessThan(5);
    expect(summary.averages).toBeUndefined();
    expect(summary.message).toContain("requires at least 5 student responses");
  });

  it("reveals aggregated feedback summary when responses reach or exceed 5 without disclosing user identities", () => {
    // Dynamically submit 5 responses
    for (let i = 1; i <= 5; i++) {
      db.submitFeedback(
        {
          course_id: "c-1",
          faculty_id: "fac-1",
          term: "Term 4",
          ratings: { content_clarity: 5, pace: 4, engagement: 5, assessment_fairness: 4, practical_relevance: 5 },
          comment: `Great course feedback from student ${i}`,
        },
        `u-anonymous-student-${i}`
      );
    }

    const summary = db.getFacultyFeedbackSummary("c-1", "fac-1", "Term 4");
    expect(summary.status).toBe("ready");
    expect(summary.count).toBeGreaterThanOrEqual(5);
    expect(summary.averages).toBeDefined();
    expect(summary.averages?.overall).toBeGreaterThanOrEqual(1);
    expect(summary.averages?.overall).toBeLessThanOrEqual(5);
  });
});

describe("Acceptance Criterion 4: Anonymous Chat 24-Hour Purge & Rotating Pseudonyms", () => {
  it("rotates pseudonym automatically every 24 hours based on UTC date", () => {
    const todayName = generateDailyPseudonym("u-rahul", "2026-10-10");
    const tomorrowName = generateDailyPseudonym("u-rahul", "2026-10-11");
    const peerName = generateDailyPseudonym("u-ananya", "2026-10-10");

    expect(todayName).not.toBe(tomorrowName);
    expect(todayName).not.toBe(peerName);
    // Follows [Adjective] [Animal] [Number] format
    expect(todayName).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+ \d{2}$/);
  });

  it("hard deletes chat messages older than 24 hours", () => {
    // Add a normal message
    db.postChatMessage("Hello from current hour", "u-rahul");

    // Manually push an old message (25 hours old) into the store
    const oldDate = new Date(Date.now() - 25 * 3600000).toISOString();
    (db as any).chatMessages.push({
      id: "expired-test-msg",
      room_id: "room-default",
      pseudonym: "Ancient Ghost 00",
      body: "This message should be purged",
      session_token: "sess-temp",
      reactions: {},
      created_at: oldDate,
    });

    const purged = db.purgeExpiredChatMessages();
    expect(purged).toBeGreaterThanOrEqual(1);

    const activeMessages = db.getChatMessages();
    const foundExpired = activeMessages.some((m) => m.id === "expired-test-msg");
    expect(foundExpired).toBe(false);
  });
});

describe("Acceptance Criterion 5: OWASP Input Sanitization", () => {
  it("neutralizes XSS script injections and event handlers", () => {
    const malicious = "<script>alert('pwned')</script>Hello World<img src=x onerror=alert(1)>";
    const cleaned = sanitizeText(malicious);
    expect(cleaned).not.toContain("<script>");
    expect(cleaned).not.toContain("onerror=");
    expect(cleaned).toContain("Hello World");
  });
});
