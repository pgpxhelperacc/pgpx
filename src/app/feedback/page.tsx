"use client";

import { useEffect, useState } from "react";
import {
  Award,
  Shield,
  Star,
  Lock,
  MessageSquare,
  AlertCircle,
  Download,
  CheckCircle2,
  Flag,
} from "lucide-react";
import { Course, Faculty, FeedbackSummary } from "@/types";

export default function FacultyFeedbackPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("c-1");
  const [selectedFacultyId, setSelectedFacultyId] = useState("fac-1");
  const [term, setTerm] = useState("Term 4");
  const [summary, setSummary] = useState<FeedbackSummary | null>(null);

  // Form ratings (1 to 5)
  const [ratings, setRatings] = useState({
    content_clarity: 5,
    pace: 4,
    engagement: 5,
    assessment_fairness: 4,
    practical_relevance: 5,
  });
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitError, setSubmitError] = useState("");

  const loadCoursesAndFaculty = async () => {
    try {
      const [schRes, summaryRes] = await Promise.all([
        fetch("/api/schedule"),
        fetch(`/api/feedback?courseId=${selectedCourseId}&facultyId=${selectedFacultyId}&term=${term}`),
      ]);
      const summaryData = await summaryRes.json();
      if (summaryData.summary) setSummary(summaryData.summary);

      // Default course choices
      setCourses([
        { id: "c-1", code: "STRAT-601", name: "Strategic Management & Execution", term: "Term 4", credits: 3.0 },
        { id: "c-2", code: "FIN-602", name: "Corporate Valuation & M&A", term: "Term 4", credits: 3.0 },
        { id: "c-3", code: "OPS-603", name: "Supply Chain Analytics", term: "Term 4", credits: 3.0 },
        { id: "c-4", code: "MKT-604", name: "Digital Marketing & Growth Engines", term: "Term 4", credits: 3.0 },
      ]);
      setFaculty([
        { id: "fac-1", name: "Prof. K. Mukherjee", department: "Strategic Management" },
        { id: "fac-2", name: "Prof. R. Sharma", department: "Finance & Accounting" },
        { id: "fac-3", name: "Prof. A. Verma", department: "Operations" },
        { id: "fac-4", name: "Prof. P. Gupta", department: "Marketing" },
      ]);
    } catch (err) {
      console.error(err);
    }
  };

  const loadSummary = async (cId: string, fId: string) => {
    try {
      const res = await fetch(`/api/feedback?courseId=${cId}&facultyId=${fId}&term=${term}`);
      const data = await res.json();
      if (data.summary) setSummary(data.summary);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadCoursesAndFaculty();
  }, []);

  const handleCourseChange = (cId: string) => {
    setSelectedCourseId(cId);
    // Auto-map primary faculty
    const map: Record<string, string> = { "c-1": "fac-1", "c-2": "fac-2", "c-3": "fac-3", "c-4": "fac-4" };
    const mappedFaculty = map[cId] || "fac-1";
    setSelectedFacultyId(mappedFaculty);
    loadSummary(cId, mappedFaculty);
  };

  const handleRatingChange = (key: keyof typeof ratings, val: number) => {
    setRatings({ ...ratings, [key]: val });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitMessage("");
    setSubmitError("");

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course_id: selectedCourseId,
          faculty_id: selectedFacultyId,
          term,
          ratings,
          comment,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit feedback");
      }

      setSubmitMessage(data.message || "Feedback submitted anonymously.");
      setComment("");
      loadSummary(selectedCourseId, selectedFacultyId);
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const ratingCriteria = [
    { key: "content_clarity" as const, label: "Content Clarity & Rigor", desc: "Clarity of concepts, structure, and slides" },
    { key: "pace" as const, label: "Class Pacing", desc: "Balanced progression through modules" },
    { key: "engagement" as const, label: "Student Engagement & Discussion", desc: "Cold calls, case dialogues, and interactivity" },
    { key: "assessment_fairness" as const, label: "Assessment Fairness", desc: "Clarity of expectations, grading rubric, and feedback" },
    { key: "practical_relevance" as const, label: "Practical & Industry Relevance", desc: "Real-world executive scenarios and applicability" },
  ];

  const handleExportCSV = () => {
    if (!summary || summary.status !== "ready") return;
    const rows = [
      ["Metric", "Score (Out of 5)"],
      ["Content Clarity", summary.averages?.content_clarity],
      ["Pace", summary.averages?.pace],
      ["Engagement", summary.averages?.engagement],
      ["Assessment Fairness", summary.averages?.assessment_fairness],
      ["Practical Relevance", summary.averages?.practical_relevance],
      ["Overall Score", summary.averages?.overall],
      ["Total Responses", summary.count],
    ];
    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `feedback-${selectedCourseId}-${selectedFacultyId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Award className="w-6 h-6 text-blue-400" />
            Faculty & Course Feedback
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Constructive anonymous feedback. Submissions use cryptographic one-way hashes to protect identity.
          </p>
        </div>

        {summary?.status === "ready" && (
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs text-zinc-300 hover:text-white transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Export CSV</span>
          </button>
        )}
      </div>

      {/* Privacy Notice Banner */}
      <div className="p-4 rounded-2xl bg-blue-950/20 border border-blue-500/20 flex items-start gap-3">
        <Lock className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <div className="text-xs text-zinc-300 space-y-1">
          <span className="font-semibold text-blue-300">Absolute Anonymity Guarantee: </span>
          <span>
            Feedback records store NO user ID. A one-way HMAC-SHA256 cryptographic hash ensures one response per student per course without revealing identity to admins or faculty. Aggregated scores remain strictly hidden until at least 5 batch responses exist.
          </span>
        </div>
      </div>

      {/* Course & Faculty Selectors */}
      <div className="flex flex-col sm:flex-row gap-3 bg-zinc-950 p-3 rounded-2xl border border-white/10">
        <div className="flex-1">
          <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-400 mb-1">
            Select Course
          </label>
          <select
            value={selectedCourseId}
            onChange={(e) => handleCourseChange(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code}: {c.name} ({c.term})
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-400 mb-1">
            Faculty
          </label>
          <select
            value={selectedFacultyId}
            onChange={(e) => {
              setSelectedFacultyId(e.target.value);
              loadSummary(selectedCourseId, e.target.value);
            }}
            className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500"
          >
            {faculty.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.department})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Two Column Layout: Feedback Form + Aggregated Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Submission Form */}
        <div className="p-6 rounded-2xl glass-panel space-y-5">
          <div className="border-b border-white/10 pb-3">
            <h2 className="text-base font-semibold text-white">
              Submit Anonymous Rating
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Rate your learning experience on a scale of 1 to 5.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {submitMessage && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{submitMessage}</span>
              </div>
            )}

            {submitError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <div className="space-y-3.5">
              {ratingCriteria.map((crit) => (
                <div key={crit.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-white">{crit.label}</span>
                    <span className="font-mono text-blue-400 font-bold">
                      {ratings[crit.key]} / 5
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">{crit.desc}</p>
                  <div className="flex items-center gap-1.5 pt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleRatingChange(crit.key, star)}
                        className={`flex-1 py-1 rounded-md text-xs font-mono font-medium border transition-all ${
                          ratings[crit.key] >= star
                            ? "bg-blue-600/20 border-blue-500/40 text-blue-300"
                            : "bg-zinc-900 border-white/5 text-zinc-600 hover:text-zinc-300"
                        }`}
                      >
                        {star}★
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Constructive Written Comment (Optional)
              </label>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share specific suggestions, pacing observations, or case study highlights..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 resize-none"
              />
              <p className="text-[10px] text-zinc-400 mt-1">
                Profanity and personal attacks are automatically filtered.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-glow transition-all active:scale-95 disabled:opacity-50"
            >
              {submitting ? "Encrypting & Submitting..." : "Submit Anonymous Evaluation"}
            </button>
          </form>
        </div>

        {/* Right Column: Aggregated View (Protected by >= 5 responses threshold) */}
        <div className="p-6 rounded-2xl glass-panel space-y-5">
          <div className="border-b border-white/10 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">
                Aggregated Batch Feedback
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Composite evaluation metrics for this module.
              </p>
            </div>
            {summary && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                {summary.count} Submissions
              </span>
            )}
          </div>

          {summary?.status === "ready" && summary.averages ? (
            <div className="space-y-5">
              {/* Overall Score Highlight */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/40 to-indigo-950/40 border border-blue-500/20 flex items-center justify-between">
                <div>
                  <div className="text-[11px] uppercase font-mono tracking-wider text-blue-300">
                    Overall Faculty Rating
                  </div>
                  <div className="text-xs text-zinc-400 mt-0.5">
                    Based on {summary.count} validated student evaluations
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-white font-mono flex items-center gap-1">
                  <span>{summary.averages.overall}</span>
                  <span className="text-amber-400 text-xl">★</span>
                </div>
              </div>

              {/* Sub-Metric Bars */}
              <div className="space-y-3">
                {Object.entries({
                  "Content Clarity": summary.averages.content_clarity,
                  "Pace & Progression": summary.averages.pace,
                  "Class Engagement": summary.averages.engagement,
                  "Assessment Fairness": summary.averages.assessment_fairness,
                  "Practical Relevance": summary.averages.practical_relevance,
                }).map(([name, score]) => (
                  <div key={name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-300">{name}</span>
                      <span className="font-mono text-white font-semibold">{score} / 5</span>
                    </div>
                    <div className="h-2 rounded-full bg-zinc-900 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${(score / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Comments Section */}
              <div className="pt-2 border-t border-white/10 space-y-2">
                <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Student Commentary ({summary.comments?.length || 0})</span>
                </div>

                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {summary.comments && summary.comments.length > 0 ? (
                    summary.comments.map((cmt, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-zinc-900/60 border border-white/5 text-xs text-zinc-300 leading-relaxed"
                      >
                        &ldquo;{cmt}&rdquo;
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-zinc-500 italic py-2">
                      No written comments provided yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center mx-auto text-amber-400">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-white">
                Anonymity Threshold Active
              </h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                {summary?.message ||
                  "Aggregated feedback requires at least 5 responses to protect individual student anonymity."}
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-zinc-900 text-amber-300 border border-amber-500/20">
                <span>Current Responses: {summary?.count || 0} / 5</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
