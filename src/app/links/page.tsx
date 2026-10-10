"use client";

import { useEffect, useState } from "react";
import {
  Bookmark,
  ExternalLink,
  Plus,
  Pin,
  Clock,
  Eye,
  AlertTriangle,
  FolderOpen,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ImportantLink, LinkCategory } from "@/types";

export default function LinksPage() {
  const [links, setLinks] = useState<ImportantLink[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states
  const [formTitle, setFormTitle] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formCategory, setFormCategory] = useState<LinkCategory>("Course material");
  const [formExpiresAt, setFormExpiresAt] = useState("");
  const [formPinned, setFormPinned] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadLinks = async () => {
    try {
      const res = await fetch("/api/links");
      const data = await res.json();
      if (data.links) setLinks(data.links);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadLinks();
  }, []);

  const handleClickLink = async (link: ImportantLink) => {
    // Record click count
    fetch("/api/links", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: link.id, action: "click" }),
    });

    setLinks((prev) =>
      prev.map((l) => (l.id === link.id ? { ...l, click_count: l.click_count + 1 } : l))
    );
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formUrl) return;

    setLoading(true);
    try {
      await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle,
          url: formUrl,
          category: formCategory,
          expires_at: formExpiresAt ? new Date(formExpiresAt).toISOString() : undefined,
          pinned: formPinned,
        }),
      });

      setFormTitle("");
      setFormUrl("");
      setFormExpiresAt("");
      setIsAddModalOpen(false);
      loadLinks();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    "All",
    "Course material",
    "Form",
    "Registration",
    "Placement",
    "Admin",
    "Tools",
  ];

  const filteredLinks = links.filter((l) => {
    if (selectedCategory === "All") return true;
    return l.category === selectedCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Bookmark className="w-6 h-6 text-emerald-400" />
            Important Links Directory
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            One central hub for Moodle, HBR packs, forms, placement drops, and campus tools.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-glow transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Resource Link</span>
        </button>
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setSelectedCategory(c)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
              selectedCategory === c
                ? "bg-white/10 text-white border border-white/15 shadow-sm"
                : "bg-zinc-950 text-zinc-400 hover:text-white border border-white/5"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Links Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLinks.map((link) => {
          const isExpiringSoon =
            link.expires_at &&
            new Date(link.expires_at).getTime() - Date.now() < 3 * 86400000 &&
            new Date(link.expires_at).getTime() > Date.now();

          return (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              onClick={() => handleClickLink(link)}
              className={`p-5 rounded-2xl glass-panel hover:border-white/20 transition-all flex flex-col justify-between group relative overflow-hidden ${
                isExpiringSoon ? "border-amber-500/40 bg-amber-950/10" : ""
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StatusBadge type="category" value={link.category} />
                    {link.pinned && (
                      <span className="flex items-center gap-1 text-[10px] font-mono text-amber-400">
                        <Pin className="w-3 h-3 rotate-45" />
                        <span>Pinned</span>
                      </span>
                    )}
                  </div>
                  <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                </div>

                <h3 className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors line-clamp-2">
                  {link.title}
                </h3>

                {link.course_name && (
                  <div className="text-[11px] font-mono text-zinc-400">
                    Course: {link.course_name}
                  </div>
                )}
              </div>

              <div className="pt-4 mt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3 text-zinc-500" />
                  {link.click_count} clicks
                </span>

                {link.expires_at ? (
                  <span
                    className={`flex items-center gap-1 ${
                      isExpiringSoon ? "text-amber-400 font-bold" : "text-zinc-500"
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    Exp: {new Date(link.expires_at).toLocaleDateString([], { month: "short", day: "numeric" })}
                  </span>
                ) : (
                  <span>Added by {link.creator_name || "Batch"}</span>
                )}
              </div>
            </a>
          );
        })}
      </div>

      {/* Add Link Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Share Important Link"
        description="Contribute course materials, registration forms, drive links, or placement portals with optional auto-expiry."
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Link Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Course Casepack Portal / Drive"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-zinc-900 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Destination URL *
            </label>
            <input
              type="url"
              required
              placeholder="https://..."
              value={formUrl}
              onChange={(e) => setFormUrl(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-zinc-900 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Category *
              </label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Course material">Course material</option>
                <option value="Form">Form</option>
                <option value="Registration">Registration</option>
                <option value="Placement">Placement</option>
                <option value="Admin">Admin</option>
                <option value="Tools">Tools</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Expiry Date (Optional)
              </label>
              <input
                type="date"
                value={formExpiresAt}
                onChange={(e) => setFormExpiresAt(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 p-3 rounded-xl bg-zinc-900 border border-white/5 text-xs text-zinc-300 cursor-pointer">
            <input
              type="checkbox"
              checked={formPinned}
              onChange={(e) => setFormPinned(e.target.checked)}
              className="rounded bg-zinc-800 border-zinc-700 text-emerald-500 focus:ring-0"
            />
            <span>Pin this resource to top of directory</span>
          </label>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-glow transition-all active:scale-95"
            >
              {loading ? "Adding..." : "Add Link"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
