"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { Bookmark } from "@/types";
import {
  BookmarkCheck,
  Trash2,
  TrendingUp,
  MapPin,
  Clock,
  AlertCircle,
  Users,
  Target,
  Edit2,
  CheckCircle2,
} from "lucide-react";

interface BookmarkEntry extends Bookmark {
  candidate: {
    id: string;
    potential_score: number | null;
    availability: string;
    target_regions: string[];
  };
}

const AVAILABILITY_LABELS: Record<string, string> = {
  immediate: "Immediate",
  "1_month": "1 Month",
  "3_months": "3 Months",
  "6_months": "6 Months",
};

function ScoreGauge({ score }: { score: number }) {
  const r = 22; const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  return (
    <div className="relative w-14 h-14 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="56" height="56">
        <circle cx="28" cy="28" r={r} fill="none" strokeWidth="4" className="stroke-muted/30" />
        <circle cx="28" cy="28" r={r} fill="none" strokeWidth="4"
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          className={score >= 70 ? "stroke-emerald-400" : score >= 50 ? "stroke-blue-400" : "stroke-amber-400"}
        />
      </svg>
      <span className="text-sm font-bold">{score}</span>
    </div>
  );
}

export default function PipelinePage() {
  const [bookmarks, setBookmarks] = useState<BookmarkEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editThreshold, setEditThreshold] = useState<number>(80);

  const loadBookmarks = useCallback(async () => {
    try {
      const res = await fetch("/api/matching/bookmarks");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setBookmarks(data.bookmarks ?? []);
    } catch {
      toast.error("Failed to load pipeline");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadBookmarks(); }, [loadBookmarks]);

  async function handleRemove(bookmarkId: string) {
    try {
      const res = await fetch(`/api/matching/bookmarks/${bookmarkId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove");
      toast.success("Removed from pipeline");
      loadBookmarks();
    } catch { toast.error("Failed to remove bookmark"); }
  }

  async function handleUpdateThreshold(bookmarkId: string, threshold: number) {
    try {
      const res = await fetch(`/api/matching/bookmarks/${bookmarkId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threshold }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast.success("Readiness threshold updated");
      setEditingId(null);
      loadBookmarks();
    } catch { toast.error("Failed to update threshold"); }
  }

  const readyCount = bookmarks.filter(
    (b) => (b.candidate?.potential_score ?? 0) >= b.readiness_threshold
  ).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookmarkCheck className="w-6 h-6 text-primary" />
            Talent Pipeline
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track bookmarked candidates and get alerted when they&apos;re ready
          </p>
        </div>
        <div className="flex items-center gap-3">
          {readyCount > 0 && (
            <Badge className="bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-3 h-3 mr-1.5" />
              {readyCount} Ready to Hire!
            </Badge>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Watching", value: bookmarks.filter((b) => (b.candidate?.potential_score ?? 0) < b.readiness_threshold).length, icon: Target, color: "text-amber-400" },
          { label: "Ready to Hire", value: readyCount, icon: CheckCircle2, color: "text-emerald-400" },
          { label: "Total Bookmarks", value: bookmarks.length, icon: BookmarkCheck, color: "text-primary" },
        ].map((stat) => (
          <div key={stat.label} className="glass rounded-xl p-4 flex items-center gap-3">
            <stat.icon className={`w-8 h-8 ${stat.color}`} />
            <div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass rounded-xl p-5 animate-pulse h-28" />
          ))}
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <BookmarkCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="font-semibold mb-2">No candidates bookmarked yet</h3>
          <p className="text-sm text-muted-foreground">
            Bookmark candidates from talent search to track their progress
          </p>
        </div>
      ) : (
        <div className="space-y-4 stagger-children">
          {bookmarks.map((bookmark) => {
            const score = bookmark.candidate?.potential_score ?? 0;
            const isReady = score >= bookmark.readiness_threshold;
            const gap = bookmark.readiness_threshold - score;

            return (
              <div key={bookmark.id} className="glass rounded-xl p-5 hover:bg-accent/5 transition-all">
                <div className="flex items-start gap-4">
                  <ScoreGauge score={score} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {isReady ? (
                        <Badge className="bg-emerald-500/20 text-emerald-400">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Ready to Hire!
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-500/20 text-amber-400">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Watching — {gap.toFixed(0)} pts needed
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {bookmark.candidate?.target_regions?.[0] ?? "Global"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {AVAILABILITY_LABELS[bookmark.candidate?.availability] ?? bookmark.candidate?.availability}
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        Threshold: {bookmark.readiness_threshold}
                      </span>
                    </div>

                    {/* Progress to threshold */}
                    {!isReady && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                          <span>Progress to readiness</span>
                          <span>{score} / {bookmark.readiness_threshold}</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full gradient-primary rounded-full transition-all duration-700"
                            style={{ width: `${Math.min(100, (score / bookmark.readiness_threshold) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {bookmark.notes && (
                      <p className="text-xs text-muted-foreground mt-2 italic">&quot;{bookmark.notes}&quot;</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                      onClick={() => {
                        setEditingId(bookmark.id);
                        setEditThreshold(bookmark.readiness_threshold);
                      }}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemove(bookmark.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Edit Threshold */}
                {editingId === bookmark.id && (
                  <div className="mt-4 pt-4 border-t border-border/50 flex items-center gap-3">
                    <label className="text-xs text-muted-foreground shrink-0">Readiness threshold:</label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={editThreshold}
                      onChange={(e) => setEditThreshold(Number(e.target.value))}
                      className="flex-1 accent-primary"
                    />
                    <span className="text-sm font-bold text-primary w-6">{editThreshold}</span>
                    <Button size="sm" className="gradient-primary text-white text-xs"
                      onClick={() => handleUpdateThreshold(bookmark.id, editThreshold)}>
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" className="text-xs"
                      onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
