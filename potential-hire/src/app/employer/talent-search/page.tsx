"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Skill } from "@/types";
import type { BlindCandidateWithMatch } from "@/lib/services/matching.service";
import {
  Search,
  Filter,
  Bookmark,
  Eye,
  TrendingUp,
  MapPin,
  Clock,
  X,
  Sparkles,
  Shield,
  Users,
  Plus,
  SlidersHorizontal,
  EyeOff,
} from "lucide-react";

const AVAILABILITY_LABELS: Record<string, string> = {
  immediate: "Immediate",
  "1_month": "1 Month",
  "3_months": "3 Months",
  "6_months": "6 Months",
};

const SCORE_COLOR = (score: number) => {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-blue-400";
  if (score >= 40) return "text-amber-400";
  return "text-red-400";
};

const SCORE_RING_COLOR = (score: number) => {
  if (score >= 80) return "stroke-emerald-400";
  if (score >= 60) return "stroke-blue-400";
  if (score >= 40) return "stroke-amber-400";
  return "stroke-red-400";
};

function ScoreGauge({ score }: { score: number }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative w-20 h-20 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="80" height="80">
        <circle cx="40" cy="40" r={radius} fill="none" stroke="currentColor" strokeWidth="5" className="text-muted/30" />
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          strokeWidth="5"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${SCORE_RING_COLOR(score)} transition-all duration-1000 animate-score-ring`}
        />
      </svg>
      <div className="text-center">
        <p className={`text-lg font-bold leading-none ${SCORE_COLOR(score)}`}>{score}</p>
        <p className="text-[8px] text-muted-foreground">/ 100</p>
      </div>
    </div>
  );
}

function CandidateCard({
  candidate,
  onBookmark,
  employerId,
}: {
  candidate: BlindCandidateWithMatch;
  onBookmark: (id: string) => void;
  employerId: string;
}) {
  const score = candidate.potential_score ?? 0;
  const topSkills = candidate.skills.slice(0, 4);
  const verifiedCount = candidate.skills.filter((s) => s.verified).length;

  return (
    <div className="glass rounded-xl p-5 hover:bg-accent/5 transition-all duration-200 group animate-fade-in">
      <div className="flex items-start gap-4">
        {/* Score Gauge */}
        <ScoreGauge score={score} />

        {/* Candidate Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <div className="flex items-center gap-1 text-xs text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full">
              <EyeOff className="w-3 h-3" />
              Blind Mode
            </div>
            {candidate.matchScore !== undefined && (
              <div className="flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3" />
                {candidate.matchScore}% Match
              </div>
            )}
            <Badge className="text-[10px] bg-emerald-500/10 text-emerald-400">
              {AVAILABILITY_LABELS[candidate.availability] ?? candidate.availability}
            </Badge>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {candidate.region}
            </span>
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-primary" />
              {verifiedCount} verified
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {Math.round(candidate.roadmap_completion)}% roadmap
            </span>
            {candidate.credential_count > 0 && (
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {candidate.credential_count} credentials
              </span>
            )}
          </div>

          {/* Skills */}
          {topSkills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {topSkills.map((cs) => (
                <Badge
                  key={cs.skill_id}
                  className={`text-[10px] ${cs.verified ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}
                >
                  {cs.verified && "✓ "}
                  {cs.skill?.name ?? cs.skill_id.slice(0, 8)}
                </Badge>
              ))}
              {candidate.skills.length > 4 && (
                <Badge className="text-[10px] bg-muted text-muted-foreground">
                  +{candidate.skills.length - 4} more
                </Badge>
              )}
            </div>
          )}

          {/* Sub-scores mini bars */}
          {candidate.score && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {[
                { label: "Velocity", val: candidate.score.learning_velocity },
                { label: "Skill Gap", val: candidate.score.skill_gap_closure },
                { label: "Assessment", val: candidate.score.assessment_performance },
                { label: "Feedback", val: candidate.score.employer_feedback },
              ].map((sub) => (
                <div key={sub.label} className="flex items-center gap-1.5">
                  <span className="text-[9px] text-muted-foreground w-14 shrink-0">{sub.label}</span>
                  <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full gradient-primary rounded-full transition-all duration-700"
                      style={{ width: `${sub.val}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-muted-foreground w-5 text-right">{Math.round(sub.val)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/50">
        <Link href={`/employer/talent-search/${candidate.id}`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full text-xs">
            <Eye className="w-3.5 h-3.5 mr-1.5" />
            View Profile
          </Button>
        </Link>
        <Button
          size="sm"
          variant="outline"
          className="text-xs text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
          onClick={() => onBookmark(candidate.id)}
        >
          <Bookmark className="w-3.5 h-3.5 mr-1.5" />
          Bookmark
        </Button>
      </div>
    </div>
  );
}

export default function TalentSearchPage() {
  const [candidates, setCandidates] = useState<BlindCandidateWithMatch[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewsRemaining, setViewsRemaining] = useState<number | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(true);

  // Filters
  const [minScore, setMinScore] = useState(0);
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);
  const [skillSearch, setSkillSearch] = useState("");
  const [region, setRegion] = useState("");
  const [availability, setAvailability] = useState("");
  const [sortBy, setSortBy] = useState<"potential_score" | "match_score" | "recent">("potential_score");

  useEffect(() => {
    fetch("/api/skills")
      .then((r) => r.json())
      .then((d) => setSkills(d.skills ?? []));
  }, []);

  const search = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/matching/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          minScore,
          skills: selectedSkills.map((s) => s.id),
          region: region || undefined,
          availability: availability || undefined,
          sortBy,
        }),
      });
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setCandidates(data.candidates ?? []);
      setViewsRemaining(data.viewsRemaining ?? null);
    } catch {
      toast.error("Failed to search candidates");
    } finally {
      setLoading(false);
    }
  }, [minScore, selectedSkills, region, availability, sortBy]);

  useEffect(() => {
    search();
  }, [search]);

  async function handleBookmark(candidateId: string) {
    try {
      const res = await fetch("/api/matching/bookmark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId, readinessThreshold: 80 }),
      });
      if (!res.ok) throw new Error("Failed to bookmark");
      toast.success("Candidate bookmarked! 🔖");
    } catch {
      toast.error("Failed to bookmark candidate");
    }
  }

  const filteredSkillSuggestions = skills
    .filter(
      (s) =>
        s.name.toLowerCase().includes(skillSearch.toLowerCase()) &&
        !selectedSkills.find((sel) => sel.id === s.id)
    )
    .slice(0, 6);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Search className="w-6 h-6 text-primary" />
            Talent Search
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Discover high-potential candidates — blind by default, bias-free
          </p>
        </div>
        <div className="flex items-center gap-3">
          {viewsRemaining !== null && (
            <div className="text-xs text-muted-foreground glass px-3 py-1.5 rounded-lg">
              <span className="font-bold text-primary">{viewsRemaining}</span> profile reveals remaining
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFiltersOpen(!filtersOpen)}
          >
            <SlidersHorizontal className="w-4 h-4 mr-1.5" />
            Filters
          </Button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Filter Panel */}
        {filtersOpen && (
          <div className="w-72 shrink-0 space-y-4 animate-slide-up">
            <div className="glass rounded-xl p-5 space-y-5">
              <h3 className="font-semibold flex items-center gap-2 text-sm">
                <Filter className="w-4 h-4 text-primary" />
                Filters
              </h3>

              {/* Min Score */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-muted-foreground">Min Potential Score</label>
                  <span className="text-sm font-bold text-primary">{minScore}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={minScore}
                  onChange={(e) => setMinScore(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>

              {/* Skills */}
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Skills</label>
                {selectedSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSkills.map((s) => (
                      <Badge
                        key={s.id}
                        className="bg-primary/20 text-primary text-[10px] cursor-pointer"
                        onClick={() => setSelectedSkills((prev) => prev.filter((x) => x.id !== s.id))}
                      >
                        {s.name} <X className="w-2.5 h-2.5 ml-1" />
                      </Badge>
                    ))}
                  </div>
                )}
                <Input
                  placeholder="Search skills..."
                  value={skillSearch}
                  onChange={(e) => setSkillSearch(e.target.value)}
                  className="h-8 text-xs"
                />
                {skillSearch && filteredSkillSuggestions.length > 0 && (
                  <div className="space-y-1">
                    {filteredSkillSuggestions.map((skill) => (
                      <button
                        key={skill.id}
                        onClick={() => {
                          setSelectedSkills((prev) => [...prev, skill]);
                          setSkillSearch("");
                        }}
                        className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-1.5"
                      >
                        <Plus className="w-3 h-3" />
                        {skill.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Region */}
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Region
                </label>
                <Input
                  placeholder="e.g. Tunisia, Remote"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              {/* Availability */}
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Availability
                </label>
                <Select onValueChange={(v) => setAvailability(v ?? "")} value={availability}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any</SelectItem>
                    <SelectItem value="immediate">Immediate</SelectItem>
                    <SelectItem value="1_month">Within 1 month</SelectItem>
                    <SelectItem value="3_months">Within 3 months</SelectItem>
                    <SelectItem value="6_months">Within 6 months</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort By */}
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Sort By</label>
                <Select
                  onValueChange={(v) => setSortBy((v ?? "potential_score") as typeof sortBy)}
                  value={sortBy}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="potential_score">Potential Score</SelectItem>
                    <SelectItem value="recent">Recent Activity</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={search}
                className="w-full gradient-primary text-white text-xs"
                size="sm"
                disabled={loading}
              >
                <Search className="w-3.5 h-3.5 mr-1.5" />
                {loading ? "Searching..." : "Search"}
              </Button>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {loading ? "Searching..." : `${candidates.length} candidates found`}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-violet-400 bg-violet-500/10 px-2.5 py-1 rounded-full">
              <EyeOff className="w-3.5 h-3.5" />
              Blind Mode — No names, photos, or demographics
            </div>
          </div>

          {loading ? (
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass rounded-xl p-5 animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 bg-muted rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/3" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                      <div className="h-3 bg-muted rounded w-2/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : candidates.length === 0 ? (
            <div className="glass rounded-xl p-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="font-semibold mb-2">No candidates found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your filters or lowering the minimum score
              </p>
            </div>
          ) : (
            <div className="grid gap-4 stagger-children">
              {candidates.map((candidate) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  onBookmark={handleBookmark}
                  employerId=""
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
