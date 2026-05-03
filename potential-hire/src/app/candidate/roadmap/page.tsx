"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabase } from "@/lib/db/supabase.browser";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Map, Loader2, Sparkles, CheckCircle2, Circle, BookOpen,
  Video, FileText, Code, ExternalLink,
} from "lucide-react";
import type { Roadmap, RoadmapPhase } from "@/types";

const resourceIcons: Record<string, React.ElementType> = {
  course: BookOpen, video: Video, article: FileText,
  project: Code, book: BookOpen,
};

export default function RoadmapPage() {
  const supabase = createBrowserSupabase();
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [targetRole, setTargetRole] = useState("");
  const [timeline, setTimeline] = useState("24");

  useEffect(() => {
    loadRoadmap();
  }, []);

  async function loadRoadmap() {
    try {
      const res = await fetch("/api/roadmap");
      const data = await res.json();
      setRoadmap(data.roadmap);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    if (!targetRole.trim()) {
      toast.error("Please enter a target role");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_role: targetRole,
          timeline_weeks: parseInt(timeline),
        }),
      });
      const data = await res.json();
      if (data.roadmap) {
        setRoadmap(data.roadmap);
        toast.success("Roadmap generated! 🎉");
      } else {
        toast.error(data.error || "Failed to generate roadmap");
      }
    } catch {
      toast.error("Failed to generate roadmap");
    } finally {
      setGenerating(false);
    }
  }

  async function handleCompleteMilestone(phaseIndex: number, milestoneIndex: number) {
    if (!roadmap) return;
    try {
      const res = await fetch("/api/roadmap/milestone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roadmapId: roadmap.id,
          phaseIndex,
          milestoneIndex,
        }),
      });
      const data = await res.json();

      // Update local state
      const updated = { ...roadmap };
      updated.phases[phaseIndex].milestones[milestoneIndex].completed = true;
      updated.completion_pct = data.completionPct;
      setRoadmap(updated);

      toast.success("Milestone completed! 🎉");
    } catch {
      toast.error("Failed to update milestone");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // No roadmap — show generator
  if (!roadmap) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Map className="w-6 h-6 text-primary" />
            AI Learning Roadmap
          </h1>
          <p className="text-muted-foreground mt-1">
            Generate a personalized learning path powered by AI
          </p>
        </div>

        <Card className="gradient-card border-border/30 max-w-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Generate Your Roadmap
            </CardTitle>
            <CardDescription>
              Tell us your target role and we&apos;ll create a step-by-step plan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Role</label>
              <Input
                placeholder="e.g., Frontend Developer"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="bg-input/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Timeline</label>
              <Select value={timeline} onValueChange={(v) => v && setTimeline(v)}>
                <SelectTrigger className="bg-input/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">12 weeks (3 months)</SelectItem>
                  <SelectItem value="24">24 weeks (6 months)</SelectItem>
                  <SelectItem value="36">36 weeks (9 months)</SelectItem>
                  <SelectItem value="52">52 weeks (1 year)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full gradient-primary text-white"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Generating with AI...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Roadmap
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show roadmap
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Map className="w-6 h-6 text-primary" />
            {roadmap.target_role} Roadmap
          </h1>
          <p className="text-muted-foreground mt-1">
            {Math.round(roadmap.completion_pct)}% complete
          </p>
        </div>
        <Badge variant="secondary" className="bg-primary/10 text-primary">
          {roadmap.status === "active" ? "In Progress" : roadmap.status}
        </Badge>
      </div>

      {/* Overall progress */}
      <Card className="border-border/30">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-bold">{Math.round(roadmap.completion_pct)}%</span>
          </div>
          <Progress value={roadmap.completion_pct} className="h-3" />
        </CardContent>
      </Card>

      {/* Phases */}
      <div className="space-y-4">
        {roadmap.phases.map((phase: RoadmapPhase, phaseIdx: number) => {
          const completedCount = phase.milestones.filter((m) => m.completed).length;
          const totalCount = phase.milestones.length;
          const phasePct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

          return (
            <Card key={phaseIdx} className="border-border/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    Phase {phaseIdx + 1}: {phase.title}
                  </CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {completedCount}/{totalCount} done · {phase.duration_weeks}w
                  </Badge>
                </div>
                <Progress value={phasePct} className="h-1.5 mt-2" />
              </CardHeader>
              <CardContent className="space-y-3">
                {phase.milestones.map((milestone, mIdx) => (
                  <div
                    key={mIdx}
                    className={`p-3 rounded-lg border transition-all ${
                      milestone.completed
                        ? "border-green-500/20 bg-green-500/5"
                        : "border-border/30 hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => !milestone.completed && handleCompleteMilestone(phaseIdx, mIdx)}
                        className="mt-0.5 shrink-0"
                        disabled={milestone.completed}
                      >
                        {milestone.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-green-400" />
                        ) : (
                          <Circle className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors cursor-pointer" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${milestone.completed ? "line-through text-muted-foreground" : ""}`}>
                          {milestone.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {milestone.description}
                        </p>

                        {/* Resources */}
                        {milestone.resources && milestone.resources.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {milestone.resources.map((resource, rIdx) => {
                              const Icon = resourceIcons[resource.type] || BookOpen;
                              return (
                                <a
                                  key={rIdx}
                                  href={resource.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-muted/30 hover:bg-primary/10 hover:text-primary transition-colors"
                                >
                                  <Icon className="w-3 h-3" />
                                  {resource.title}
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              );
                            })}
                          </div>
                        )}

                        {/* Skills */}
                        {milestone.skills && milestone.skills.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {milestone.skills.map((skill) => (
                              <Badge key={skill} variant="outline" className="text-[10px] py-0">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
