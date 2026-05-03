"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Skill } from "@/types";
import {
  FileText,
  MapPin,
  DollarSign,
  TrendingUp,
  EyeOff,
  Eye,
  X,
  Plus,
  ArrowLeft,
  Sparkles,
} from "lucide-react";

const schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(50, "Description must be at least 50 characters"),
  min_potential_score: z.number().min(0).max(100),
  region: z.string().min(2, "Region is required"),
  salary_min: z.number().optional(),
  salary_max: z.number().optional(),
  type: z.enum(["full_time", "part_time", "contract", "internship"]),
  blind_mode: z.boolean(),
  status: z.enum(["draft", "active"]),
});

type FormData = z.infer<typeof schema>;

export default function CreateJobPage() {
  const router = useRouter();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);
  const [skillSearch, setSkillSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [scoreValue, setScoreValue] = useState(60);
  const [blindMode, setBlindMode] = useState(true);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      min_potential_score: 60,
      region: "Remote",
      type: "full_time",
      blind_mode: true,
      status: "draft",
    },
  });

  useEffect(() => {
    async function loadSkills() {
      const res = await fetch("/api/skills");
      if (res.ok) {
        const data = await res.json();
        setSkills(data.skills ?? []);
      }
    }
    loadSkills();
  }, []);

  const filteredSkills = skills
    .filter(
      (s) =>
        s.name.toLowerCase().includes(skillSearch.toLowerCase()) &&
        !selectedSkills.find((sel) => sel.id === s.id)
    )
    .slice(0, 8);

  function toggleSkill(skill: Skill) {
    setSelectedSkills((prev) =>
      prev.find((s) => s.id === skill.id)
        ? prev.filter((s) => s.id !== skill.id)
        : [...prev, skill]
    );
  }

  async function onSubmit(data: FormData, saveAsDraft = false) {
    setIsLoading(true);
    try {
      const res = await fetch("/api/employers/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          status: saveAsDraft ? "draft" : data.status,
          required_skills: selectedSkills.map((s) => s.id),
          min_potential_score: scoreValue,
          blind_mode: blindMode,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create job");
      }
      toast.success(saveAsDraft ? "Job saved as draft" : "Job post created!");
      router.push("/employer/jobs");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create job");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="text-muted-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create Job Post</h1>
          <p className="text-sm text-muted-foreground">
            Define what you&apos;re looking for — candidates will be matched by potential
          </p>
        </div>
      </div>

      <form
        onSubmit={form.handleSubmit((data) => onSubmit(data))}
        className="space-y-6"
      >
        {/* Basic Info */}
        <div className="glass rounded-xl p-6 space-y-5">
          <h2 className="font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Job Details
          </h2>

          <div className="space-y-2">
            <Label htmlFor="title">Job Title *</Label>
            <Input
              id="title"
              placeholder="e.g. Frontend Developer, Data Analyst"
              {...form.register("title")}
              className={form.formState.errors.title ? "border-destructive" : ""}
            />
            {form.formState.errors.title && (
              <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe the role, responsibilities, and what success looks like..."
              rows={5}
              {...form.register("description")}
              className={form.formState.errors.description ? "border-destructive" : ""}
            />
            {form.formState.errors.description && (
              <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Job Type *</Label>
              <Select
                onValueChange={(val) =>
                  form.setValue("type", val as FormData["type"])
                }
                defaultValue="full_time"
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_time">Full-time</SelectItem>
                  <SelectItem value="part_time">Part-time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="internship">Internship</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="region" className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                Region *
              </Label>
              <Input
                id="region"
                placeholder="e.g. Remote, Tunisia, France"
                {...form.register("region")}
              />
            </div>
          </div>
        </div>

        {/* Required Skills */}
        <div className="glass rounded-xl p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Required Skills
          </h2>

          {selectedSkills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedSkills.map((skill) => (
                <Badge
                  key={skill.id}
                  className="bg-primary/20 text-primary pr-1 cursor-pointer hover:bg-destructive/20 hover:text-destructive transition-colors"
                  onClick={() => toggleSkill(skill)}
                >
                  {skill.name}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              ))}
            </div>
          )}

          <Input
            placeholder="Search and add skills..."
            value={skillSearch}
            onChange={(e) => setSkillSearch(e.target.value)}
          />

          {skillSearch && filteredSkills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {filteredSkills.map((skill) => (
                <button
                  key={skill.id}
                  type="button"
                  onClick={() => {
                    toggleSkill(skill);
                    setSkillSearch("");
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted hover:bg-primary/10 hover:text-primary text-sm transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  {skill.name}
                </button>
              ))}
            </div>
          )}

          {selectedSkills.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Add skills to improve candidate matching accuracy
            </p>
          )}
        </div>

        {/* Scoring & Compensation */}
        <div className="glass rounded-xl p-6 space-y-5">
          <h2 className="font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Matching Criteria
          </h2>

          {/* Score Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Minimum Potential Score</Label>
              <span className="text-2xl font-bold gradient-text">{scoreValue}</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={scoreValue}
              onChange={(e) => setScoreValue(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0 — Open to all</span>
              <span>100 — Top 1%</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Candidates below this score will not appear in matches
            </p>
          </div>

          {/* Salary */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" />
              Salary Range (USD/year, optional)
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                placeholder="Min (e.g. 30000)"
                {...form.register("salary_min", { valueAsNumber: true })}
              />
              <Input
                type="number"
                placeholder="Max (e.g. 60000)"
                {...form.register("salary_max", { valueAsNumber: true })}
              />
            </div>
          </div>

          {/* Blind Mode Toggle */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {blindMode ? (
                  <EyeOff className="w-4 h-4 text-violet-400" />
                ) : (
                  <Eye className="w-4 h-4 text-muted-foreground" />
                )}
                <span className="font-medium text-sm">Blind Hiring Mode</span>
                {blindMode && (
                  <Badge className="bg-violet-500/20 text-violet-400 text-[10px]">ON</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Hide candidate names, photos, and demographics in first-round review
              </p>
            </div>
            <button
              type="button"
              onClick={() => setBlindMode(!blindMode)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                blindMode ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  blindMode ? "translate-x-7" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => form.handleSubmit((data) => onSubmit(data, true))()}
            disabled={isLoading}
          >
            Save as Draft
          </Button>
          <Button
            type="submit"
            className="flex-1 gradient-primary text-white"
            disabled={isLoading}
            onClick={() => form.setValue("status", "active")}
          >
            {isLoading ? "Publishing..." : "Publish Job Post"}
            <Sparkles className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
