"use client";

import { useEffect, useState } from "react";
import {
  Award,
  Plus,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Star,
  Send,
  Layers,
  Sparkles,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { FeedbackThread } from "@/types";

export default function FacultyFeedbackPage() {
  const [threads, setThreads] = useState<FeedbackThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form state
  const [subjectName, setSubjectName] = useState("");
  const [facultyName, setFacultyName] = useState("");
  const [title, setTitle] = useState("");
  const [review, setReview] = useState("");
  const [rating, setRating] = useState("5");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Comment input per thread
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

  const loadThreads = async () => {
    try {
      const res = await fetch("/api/feedback");
      const data = await res.json();
      if (data.threads) setThreads(data.threads);
    } catch (err) {
      console.error("Failed to load feedback", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadThreads();
  }, []);

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName.trim() || !facultyName.trim() || !review.trim()) {
      setError("Please fill out Subject Name, Faculty Name and Review.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject_name: subjectName,
          faculty_name: facultyName,
          title: title || `${subjectName} Review`,
          review,
          rating: Number(rating) || 5,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to post review");
      }

      setSubjectName("");
      setFacultyName("");
      setTitle("");
      setReview("");
      setModalOpen(false);
      loadThreads();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (threadId: string, direction: "up" | "down") => {
    // Optimistic update
    setThreads((prev) =>
      prev.map((t) => {
        if (t.id !== threadId) return t;
        const currentVote = t.voted;
        let upvotes = t.upvotes;
        let downvotes = t.downvotes;
        let newVote: "up" | "down" | null = direction;

        if (currentVote === direction) {
          // unvote
          newVote = null;
          if (direction === "up") upvotes = Math.max(0, upvotes - 1);
          if (direction === "down") downvotes = Math.max(0, downvotes - 1);
        } else {
          if (currentVote === "up") upvotes = Math.max(0, upvotes - 1);
          if (currentVote === "down") downvotes = Math.max(0, downvotes - 1);
          if (direction === "up") upvotes += 1;
          if (direction === "down") downvotes += 1;
        }

        return { ...t, upvotes, downvotes, voted: newVote };
      })
    );

    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "vote", thread_id: threadId, direction }),
      });
    } catch (err) {
      // rollback on error
      loadThreads();
    }
  };

  const handleAddComment = async (threadId: string) => {
    const commentText = commentInputs[threadId]?.trim();
    if (!commentText) return;

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "comment", thread_id: threadId, comment: commentText }),
      });
      if (res.ok) {
        setCommentInputs((prev) => ({ ...prev, [threadId]: "" }));
        loadThreads();
      }
    } catch (err) {
      // silent
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#1c1c1f] gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-[#71717a] mb-1">
            <span>PGPX</span>
            <span>/</span>
            <span className="text-zinc-300">COMMUNITY</span>
            <span>/</span>
            <span>FACULTY REVIEWS</span>
          </div>
          <h1 className="text-lg sm:text-xl font-medium text-white tracking-tight">
            Course & Faculty Feedback
          </h1>
          <p className="text-xs text-[#71717a] mt-0.5">
            Anonymous student feedback on subjects and professors. Upvote helpful insights and join the discussion.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white text-black hover:bg-[#eaeaea] font-medium text-xs transition-colors self-start sm:self-auto active:scale-95 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Post Review</span>
        </button>
      </div>

      {/* Review Threads Stream */}
      {loading ? (
        <div className="p-12 text-center text-xs text-[#71717a] font-mono">
          Loading feedback reviews...
        </div>
      ) : threads.length === 0 ? (
        /* Clean Empty State */
        <div className="p-12 rounded-xl border border-dashed border-[#1e1e22] bg-[#0c0c0e]/60 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-[#141416] border border-[#242428] flex items-center justify-center mx-auto text-[#71717a]">
            <Award className="w-5 h-5" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="text-sm font-medium text-white">No reviews posted yet</h3>
            <p className="text-xs text-[#71717a] leading-relaxed">
              Help your batchmates! Be the first to add a subject, professor name, and your honest review.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => setModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-white text-black hover:bg-[#eaeaea] font-medium text-xs transition-colors"
            >
              + Post First Review
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {threads.map((thread) => {
            const score = thread.upvotes - thread.downvotes;
            const commentsOpen = expandedComments[thread.id] ?? false;

            return (
              <div
                key={thread.id}
                className="rounded-xl border border-[#1e1e22] bg-[#0c0c0e] hover:border-[#2a2a30] transition-colors p-4 space-y-3"
              >
                {/* Top Row: Subject & Faculty */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-[#161619] text-white border border-[#26262a]">
                      {thread.subject_name}
                    </span>
                    <span className="text-xs text-[#a1a1aa] font-medium">
                      {thread.faculty_name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-[#71717a] font-mono">
                    {thread.rating && (
                      <div className="flex items-center gap-0.5 text-zinc-300 mr-2">
                        <Star className="w-3 h-3 fill-white text-white" />
                        <span>{thread.rating}/5</span>
                      </div>
                    )}
                    <span>{new Date(thread.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Title & Review Content */}
                <div className="space-y-1">
                  {thread.title && (
                    <h3 className="text-sm font-medium text-white">{thread.title}</h3>
                  )}
                  <p className="text-xs text-[#d4d4d8] leading-relaxed whitespace-pre-wrap">
                    {thread.review}
                  </p>
                </div>

                {/* Footer: Author, Voting, and Comments Toggle */}
                <div className="flex items-center justify-between pt-2 border-t border-[#18181b] text-xs">
                  <span className="text-[11px] font-mono text-[#71717a]">
                    by {thread.author_pseudonym}
                  </span>

                  <div className="flex items-center gap-3">
                    {/* Upvote & Downvote */}
                    <div className="flex items-center gap-1 bg-[#141416] border border-[#222226] rounded-md px-1.5 py-0.5">
                      <button
                        onClick={() => handleVote(thread.id, "up")}
                        className={`p-1 rounded hover:text-white transition-colors ${
                          thread.voted === "up" ? "text-white font-bold" : "text-[#71717a]"
                        }`}
                        title="Upvote review"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-mono text-zinc-200 px-1">
                        {score}
                      </span>
                      <button
                        onClick={() => handleVote(thread.id, "down")}
                        className={`p-1 rounded hover:text-white transition-colors ${
                          thread.voted === "down" ? "text-white font-bold" : "text-[#71717a]"
                        }`}
                        title="Downvote review"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Comments Toggle */}
                    <button
                      onClick={() =>
                        setExpandedComments((prev) => ({
                          ...prev,
                          [thread.id]: !commentsOpen,
                        }))
                      }
                      className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#141416] hover:bg-[#1a1a1e] border border-[#222226] text-[#a1a1aa] hover:text-white transition-colors text-xs"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>{thread.comments?.length || 0}</span>
                    </button>
                  </div>
                </div>

                {/* Collapsible Discussion Comments */}
                {commentsOpen && (
                  <div className="pt-3 border-t border-[#18181b] space-y-3">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-[#71717a]">
                      Discussion & Replies ({thread.comments?.length || 0})
                    </div>

                    {thread.comments && thread.comments.length > 0 ? (
                      <div className="space-y-2">
                        {thread.comments.map((c) => (
                          <div
                            key={c.id}
                            className="p-2.5 rounded-lg bg-[#121214] border border-[#1e1e22] text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between text-[10px] font-mono text-[#71717a]">
                              <span className="text-zinc-300">{c.author_pseudonym}</span>
                              <span>{new Date(c.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                            </div>
                            <p className="text-zinc-300 leading-relaxed">{c.body}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-[#52525b] italic">
                        No replies yet. Join the conversation below.
                      </p>
                    )}

                    {/* Add Comment Input */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="Add your experience or ask a question..."
                        value={commentInputs[thread.id] || ""}
                        onChange={(e) =>
                          setCommentInputs((prev) => ({
                            ...prev,
                            [thread.id]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddComment(thread.id);
                        }}
                        className="flex-1 bg-[#121214] border border-[#222226] px-3 py-1.5 rounded-lg text-xs text-white placeholder-[#52525b] focus:outline-none focus:border-[#3a3a42]"
                      />
                      <button
                        onClick={() => handleAddComment(thread.id)}
                        className="p-1.5 rounded-lg bg-white text-black hover:bg-[#eaeaea] transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Post Review Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Post Course & Faculty Feedback"
        description="Share honest review, workload expectations, and grading tips. Completely anonymous."
      >
        <form onSubmit={handleCreateThread} className="space-y-3.5">
          {error && (
            <div className="p-2.5 rounded-lg bg-[#141416] border border-[#26262a] text-zinc-300 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Subject / Course Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Corporate Strategy, Financial Analytics, etc."
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#121214] border border-[#222226] text-xs text-white placeholder-[#52525b] focus:outline-none focus:border-[#3a3a42]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Faculty / Professor Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Prof. Sharma"
              value={facultyName}
              onChange={(e) => setFacultyName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#121214] border border-[#222226] text-xs text-white placeholder-[#52525b] focus:outline-none focus:border-[#3a3a42]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Headline / Title (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Great case discussions, heavy reading"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#121214] border border-[#222226] text-xs text-white placeholder-[#52525b] focus:outline-none focus:border-[#3a3a42]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Rating
              </label>
              <select
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                className="w-full px-2.5 py-2 rounded-lg bg-[#121214] border border-[#222226] text-xs text-white focus:outline-none"
              >
                <option value="5">★★★★★ (5/5 Excellent)</option>
                <option value="4">★★★★☆ (4/5 Very Good)</option>
                <option value="3">★★★☆☆ (3/5 Average)</option>
                <option value="2">★★☆☆☆ (2/5 Tough / Challenging)</option>
                <option value="1">★☆☆☆☆ (1/5 Needs Improvement)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Detailed Feedback & Tips *
            </label>
            <textarea
              required
              rows={3}
              placeholder="How are the lectures? Is CP (Class Participation) heavily graded? Any tips for quizzes and assignments?"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#121214] border border-[#222226] text-xs text-white placeholder-[#52525b] focus:outline-none focus:border-[#3a3a42] resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1c1c20]">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-3 py-1.5 rounded-lg text-xs text-[#71717a] hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 rounded-lg bg-white text-black font-medium text-xs hover:bg-[#eaeaea] transition-colors disabled:opacity-50"
            >
              {submitting ? "Posting..." : "Publish Review"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
