"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabase } from "@/lib/db/supabase.browser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import {
  Sparkles,
  TrendingUp,
  Target,
  Award,
  Map,
  ArrowRight,
  Briefcase,
  ShieldCheck,
  Zap,
  Loader2,
} from "lucide-react";

interface DashboardData {
  user: { full_name: string } | null;
  candidate: {
    potential_score: number | null;
    career_goals: string[];
    headline: string | null;
  } | null;
  skillCount: number;
  credentialCount: number;
  roadmapCompletion: number;
  score: {
    total_score: number;
    learning_velocity: number;
    skill_gap_closure: number;
    assessment_performance: number;
    project_consistency: number;
    credential_quality: number;
    roadmap_progress: number;
    simulation_performance: number;
    employer_feedback: number;
  } | null;
}

const SUB_SCORES = [
  { key: "learning_velocity", label: "Learning Velocity", icon: Zap, weight: "20%" },
  { key: "skill_gap_closure", label: "Skill Gap Closure", icon: Target, weight: "18%" },
  { key: "assessment_performance", label: "Assessment Score", icon: ShieldCheck, weight: "15%" },
  { key: "project_consistency", label: "Project Consistency", icon: Briefcase, weight: "12%" },
  { key: "credential_quality", label: "Credential Quality", icon: Award, weight: "10%" },
  { key: "roadmap_progress", label: "Roadmap Progress", icon: Map, weight: "10%" },
] as const;

function ScoreRing({ score, size = 140 }: { score: number; size?: number }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 75) return "oklch(0.72 0.19 145)";
    if (s >= 50) return "oklch(0.75 0.18 85)";
    if (s >= 25) return "oklch(0.70 0.20 60)";
    return "oklch(0.65 0.22 25)";
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="text-muted/30"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor(score)}
          strokeWidth="8"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="animate-score-ring transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold">{score}</span>
        <span className="text-xs text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

function getReadinessLevel(score: number) {
  if (score >= 80) return { label: "Hire-Ready", color: "text-green-400", pct: 100 };
  if (score >= 60) return { label: "Almost Ready", color: "text-blue-400", pct: 75 };
  if (score >= 35) return { label: "Building", color: "text-yellow-400", pct: 50 };
  return { label: "Getting Started", color: "text-orange-400", pct: 25 };
}

export default function CandidateDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserSupabase();

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: userData } = await supabase
          .from("users")
          .select("full_name")
          .eq("id", user.id)
          .single();

        const { data: candidate } = await supabase
          .from("candidates")
          .select("id, potential_score, career_goals, headline")
          .eq("user_id", user.id)
          .single();

        if (!candidate) {
          setData({ user: userData, candidate: null, skillCount: 0, credentialCount: 0, roadmapCompletion: 0, score: null });
          setLoading(false);
          return;
        }

        const [skillsRes, credsRes, roadmapRes, scoreRes] = await Promise.all([
          supabase.from("candidate_skills").select("*", { count: "exact", head: true }).eq("candidate_id", candidate.id),
          supabase.from("credentials").select("*", { count: "exact", head: true }).eq("candidate_id", candidate.id),
          supabase.from("roadmaps").select("completion_pct").eq("candidate_id", candidate.id).eq("status", "active").single(),
          supabase.from("potential_scores").select("*").eq("candidate_id", candidate.id).order("computed_at", { ascending: false }).limit(1).single(),
        ]);

        setData({
          user: userData,
          candidate,
          skillCount: skillsRes.count || 0,
          credentialCount: credsRes.count || 0,
          roadmapCompletion: roadmapRes.data?.completion_pct || 0,
          score: scoreRes.data,
        });
      } catch (error) {
        console.error("Dashboard load error:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const score = data?.candidate?.potential_score || 0;
  const readiness = getReadinessLevel(score);
  const firstName = data?.user?.full_name?.split(" ")[0] || "there";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back, <span className="gradient-text">{firstName}</span> 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          {data?.candidate?.headline || "Track your progress and grow your potential"}
        </p>
      </div>

      {/* Top Row: Score + Readiness */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Potential Score */}
        <Card className="gradient-card border-border/30 glow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Potential Score
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-6">
            <ScoreRing score={score} />
            <div className="space-y-3 flex-1">
              {SUB_SCORES.slice(0, 4).map((sub) => {
                const value = data?.score?.[sub.key as keyof typeof data.score] as number || 0;
                return (
                  <div key={sub.key} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{sub.label}</span>
                      <span className="font-medium">{value}</span>
                    </div>
                    <Progress value={value} className="h-1.5" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Hiring Readiness */}
        <Card className="gradient-card border-border/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Hiring Readiness
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className={`text-2xl font-bold ${readiness.color}`}>
                {readiness.label}
              </p>
              <Progress value={readiness.pct} className="h-2 mt-3" />
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="text-center p-3 rounded-lg bg-muted/20">
                <p className="text-xl font-bold">{data?.skillCount || 0}</p>
                <p className="text-xs text-muted-foreground">Skills</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/20">
                <p className="text-xl font-bold">{data?.credentialCount || 0}</p>
                <p className="text-xs text-muted-foreground">Credentials</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/20">
                <p className="text-xl font-bold">{Math.round(data?.roadmapCompletion || 0)}%</p>
                <p className="text-xs text-muted-foreground">Roadmap</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Cards */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Recommended Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 stagger-children">
          {(!data?.candidate?.career_goals || data.candidate.career_goals.length === 0) && (
            <Link href="/candidate/profile">
              <Card className="border-border/30 hover:border-primary/40 transition-all cursor-pointer group h-full">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Target className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Set Career Goals</p>
                    <p className="text-xs text-muted-foreground">Define your target roles</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardContent>
              </Card>
            </Link>
          )}

          {(data?.roadmapCompletion || 0) === 0 && (
            <Link href="/candidate/roadmap">
              <Card className="border-border/30 hover:border-primary/40 transition-all cursor-pointer group h-full">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-chart-3/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Map className="w-5 h-5 text-chart-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Generate AI Roadmap</p>
                    <p className="text-xs text-muted-foreground">Get a personalized learning path</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardContent>
              </Card>
            </Link>
          )}

          {(data?.credentialCount || 0) === 0 && (
            <Link href="/candidate/credentials">
              <Card className="border-border/30 hover:border-primary/40 transition-all cursor-pointer group h-full">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-chart-2/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Award className="w-5 h-5 text-chart-2" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Add Credentials</p>
                    <p className="text-xs text-muted-foreground">Verify your certificates</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardContent>
              </Card>
            </Link>
          )}

          <Link href="/candidate/assessments">
            <Card className="border-border/30 hover:border-primary/40 transition-all cursor-pointer group h-full">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-chart-5/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-5 h-5 text-chart-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Take an Assessment</p>
                  <p className="text-xs text-muted-foreground">Verify your skills with a quiz</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/candidate/marketplace">
            <Card className="border-border/30 hover:border-primary/40 transition-all cursor-pointer group h-full">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-chart-4/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Briefcase className="w-5 h-5 text-chart-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Browse Internships</p>
                  <p className="text-xs text-muted-foreground">Find micro-internship projects</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Career Goals */}
      {data?.candidate?.career_goals && data.candidate.career_goals.length > 0 && (
        <Card className="border-border/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Your Target Roles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.candidate.career_goals.map((goal) => (
                <Badge key={goal} variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                  {goal}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
