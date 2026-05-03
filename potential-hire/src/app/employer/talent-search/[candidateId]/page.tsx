"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Eye, EyeOff, MapPin, Clock, TrendingUp, Shield, Award,
  Sparkles, Bookmark, MessageSquare, Zap, Globe, CheckCircle2,
} from "lucide-react";

const AVAILABILITY_LABELS: Record<string, string> = {
  immediate: "Immediately Available",
  "1_month": "Available in 1 Month",
  "3_months": "Available in 3 Months",
  "6_months": "Available in 6 Months",
};

const SCORE_COLOR = (s: number) =>
  s >= 80 ? "text-emerald-400" : s >= 60 ? "text-blue-400" : s >= 40 ? "text-amber-400" : "text-red-400";
const SCORE_RING = (s: number) =>
  s >= 80 ? "stroke-emerald-400" : s >= 60 ? "stroke-blue-400" : s >= 40 ? "stroke-amber-400" : "stroke-red-400";

function BigScoreRing({ score }: { score: number }) {
  const r = 56; const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  return (
    <div className="relative w-40 h-40 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="160" height="160">
        <circle cx="80" cy="80" r={r} fill="none" strokeWidth="8" className="stroke-muted/30" />
        <circle cx="80" cy="80" r={r} fill="none" strokeWidth="8"
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          className={`${SCORE_RING(score)} animate-score-ring transition-all duration-1000`}
        />
      </svg>
      <div className="text-center">
        <p className={`text-4xl font-bold ${SCORE_COLOR(score)}`}>{score}</p>
        <p className="text-xs text-muted-foreground">/100</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">Potential Score</p>
      </div>
    </div>
  );
}

export default function CandidateDetailPage() {
  const { candidateId } = useParams<{ candidateId: string }>();
  const router = useRouter();
  const [data, setData] = useState<{ candidate: any; user: any } | null>(null);
  const [blindData, setBlindData] = useState<any>(null);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [revealing, setRevealing] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  // Load blind profile first (from matching/search context)
  useEffect(() => {
    async function loadBlind() {
      try {
        const res = await fetch("/api/matching/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        if (res.ok) {
          const d = await res.json();
          const found = d.candidates?.find((c: any) => c.id === candidateId);
          if (found) setBlindData(found);
        }
      } finally {
        setLoading(false);
      }
    }
    loadBlind();
  }, [candidateId]);

  async function handleReveal() {
    setRevealing(true);
    try {
      const res = await fetch(`/api/matching/candidates/${candidateId}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to reveal");
      }
      const d = await res.json();
      setData(d);
      setRevealed(true);
      toast.success("Profile revealed! 🎉");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reveal profile");
    } finally {
      setRevealing(false);
    }
  }

  async function handleBookmark() {
    try {
      const res = await fetch("/api/matching/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId, readinessThreshold: 80 }),
      });
      if (!res.ok) throw new Error("Failed");
      setBookmarked(true);
      toast.success("Added to pipeline! 🔖");
    } catch {
      toast.error("Failed to bookmark candidate");
    }
  }

  const score = blindData?.potential_score ?? 0;
  const skills = blindData?.skills ?? [];
  const subscores = blindData?.score;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Search
        </Button>
      </div>

      {loading ? (
        <div className="glass rounded-xl p-12 animate-pulse h-64" />
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left — Score + Identity */}
          <div className="glass rounded-xl p-6 flex flex-col items-center text-center space-y-4">
            <BigScoreRing score={score} />

            <div className="space-y-2 w-full">
              {revealed && data ? (
                <>
                  <p className="text-xl font-bold">{data.user?.full_name ?? "—"}</p>
                  <p className="text-sm text-muted-foreground">{data.user?.email}</p>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-center gap-2 text-violet-400">
                    <EyeOff className="w-4 h-4" />
                    <span className="text-sm font-medium">Identity Hidden</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Reveal profile to see name, email, and contact info
                  </p>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground w-full justify-center">
              <MapPin className="w-3.5 h-3.5" />
              {blindData?.region ?? "Global"}
              <span>·</span>
              <Clock className="w-3.5 h-3.5" />
              {AVAILABILITY_LABELS[blindData?.availability] ?? blindData?.availability}
            </div>

            <div className="flex flex-col gap-2 w-full pt-2 border-t border-border/50">
              {!revealed ? (
                <Button
                  className="w-full gradient-primary text-white"
                  onClick={handleReveal}
                  disabled={revealing}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {revealing ? "Revealing..." : "Reveal Profile (1 view)"}
                </Button>
              ) : (
                <div className="flex items-center gap-2 justify-center text-xs text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  Profile Revealed
                </div>
              )}
              <Button
                variant="outline"
                className={`w-full text-sm ${bookmarked ? "text-amber-400 border-amber-500/30" : ""}`}
                onClick={handleBookmark}
                disabled={bookmarked}
              >
                <Bookmark className="w-4 h-4 mr-2" />
                {bookmarked ? "In Pipeline ✓" : "Add to Pipeline"}
              </Button>
            </div>
          </div>

          {/* Middle — Skills + Sub-scores */}
          <div className="space-y-5">
            {/* Skills */}
            <div className="glass rounded-xl p-5">
              <h2 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                <Sparkles className="w-4 h-4 text-primary" />
                Skills ({skills.length})
              </h2>
              {skills.length === 0 ? (
                <p className="text-xs text-muted-foreground">No skills data available</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {skills.map((cs: any) => (
                    <Badge
                      key={cs.skill_id}
                      className={`text-xs ${cs.verified ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}
                    >
                      {cs.verified && <CheckCircle2 className="w-2.5 h-2.5 mr-1" />}
                      {cs.skill?.name ?? cs.skill_id.slice(0, 8)}
                      {cs.proficiency && <span className="ml-1 opacity-60">{cs.proficiency}</span>}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Sub-scores */}
            {subscores && (
              <div className="glass rounded-xl p-5">
                <h2 className="font-semibold mb-4 flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Score Breakdown
                </h2>
                <div className="space-y-3">
                  {[
                    { label: "Learning Velocity", val: subscores.learning_velocity, icon: Zap },
                    { label: "Skill Gap Closure", val: subscores.skill_gap_closure, icon: TrendingUp },
                    { label: "Assessment Perf.", val: subscores.assessment_performance, icon: Shield },
                    { label: "Project Consistency", val: subscores.project_consistency, icon: CheckCircle2 },
                    { label: "Credential Quality", val: subscores.credential_quality, icon: Award },
                    { label: "Roadmap Progress", val: subscores.roadmap_progress, icon: Globe },
                    { label: "Employer Feedback", val: subscores.employer_feedback, icon: MessageSquare },
                  ].map((sub) => (
                    <div key={sub.label} className="flex items-center gap-2">
                      <sub.icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="text-xs text-muted-foreground w-28 shrink-0">{sub.label}</span>
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full gradient-primary rounded-full transition-all duration-700"
                          style={{ width: `${sub.val ?? 0}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium w-6 text-right">{Math.round(sub.val ?? 0)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right — Qualifications */}
          <div className="space-y-5">
            <div className="glass rounded-xl p-5">
              <h2 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                <Award className="w-4 h-4 text-primary" />
                Quick Stats
              </h2>
              <div className="space-y-3">
                {[
                  { label: "Credentials", value: blindData?.credential_count ?? 0, icon: Award },
                  { label: "Roadmap Completion", value: `${Math.round(blindData?.roadmap_completion ?? 0)}%`, icon: TrendingUp },
                  { label: "Verified Skills", value: skills.filter((s: any) => s.verified).length, icon: Shield },
                  { label: "Languages", value: (blindData?.languages ?? []).join(", ") || "—", icon: Globe },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <stat.icon className="w-3.5 h-3.5" />
                      {stat.label}
                    </span>
                    <span className="text-sm font-semibold">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {revealed && data && data.candidate?.candidate_skills?.length > 0 && (
              <div className="glass rounded-xl p-5">
                <h2 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Full Skill Profile
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {data.candidate.candidate_skills.map((cs: any) => (
                    <Badge key={cs.skill_id} className={`text-[10px] ${cs.verified ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {cs.skills?.name ?? "Skill"} · {cs.proficiency}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="glass rounded-xl p-5">
              <h2 className="font-semibold mb-3 text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                Contact
              </h2>
              {revealed && data ? (
                <div className="space-y-2">
                  <p className="text-sm">{data.user?.full_name}</p>
                  <a href={`mailto:${data.user?.email}`} className="text-sm text-primary hover:underline block">
                    {data.user?.email}
                  </a>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Reveal profile to access contact info</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
