"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/db/supabase.browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, ArrowRight, ArrowLeft, Plus, X, Sparkles, CheckCircle2, Rocket } from "lucide-react";

const STEPS = ["About You", "Career Goals", "Your Skills"];

const POPULAR_ROLES = [
  "Frontend Developer", "Backend Developer", "Full-Stack Developer",
  "Data Analyst", "UI/UX Designer", "Product Manager",
  "DevOps Engineer", "Mobile Developer", "Machine Learning Engineer",
  "Digital Marketer", "Content Writer", "Business Analyst",
];

const REGIONS = [
  "Remote / Worldwide", "United States", "United Kingdom", "Germany",
  "France", "Canada", "Australia", "Netherlands", "UAE",
  "Singapore", "India", "Algeria", "Morocco", "Tunisia",
  "Egypt", "Nigeria", "South Africa", "Brazil",
];

const LANGUAGES_LIST = [
  "English", "French", "Arabic", "German", "Spanish",
  "Portuguese", "Chinese", "Japanese", "Hindi", "Turkish",
  "Italian", "Dutch", "Korean", "Russian",
];

export default function CandidateOnboarding() {
  const router = useRouter();
  const supabase = createBrowserSupabase();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Step 1: About you
  const [headline, setHeadline] = useState("");
  const [languages, setLanguages] = useState<{ language: string; level: string }[]>([
    { language: "English", level: "fluent" },
  ]);

  // Step 2: Career goals
  const [careerGoals, setCareerGoals] = useState<string[]>([]);
  const [goalInput, setGoalInput] = useState("");
  const [targetRegions, setTargetRegions] = useState<string[]>([]);
  const [availability, setAvailability] = useState("immediate");

  // Step 3: Skills
  const [skills, setSkills] = useState<{ skill_name: string; proficiency: string }[]>([]);
  const [skillInput, setSkillInput] = useState("");

  function addLanguage() {
    setLanguages([...languages, { language: "", level: "basic" }]);
  }

  function removeLanguage(index: number) {
    setLanguages(languages.filter((_, i) => i !== index));
  }

  function addGoal() {
    if (goalInput.trim() && !careerGoals.includes(goalInput.trim())) {
      setCareerGoals([...careerGoals, goalInput.trim()]);
      setGoalInput("");
    }
  }

  function addSkill() {
    if (skillInput.trim() && !skills.find((s) => s.skill_name === skillInput.trim())) {
      setSkills([...skills, { skill_name: skillInput.trim(), proficiency: "beginner" }]);
      setSkillInput("");
    }
  }

  function toggleRegion(region: string) {
    setTargetRegions((prev) =>
      prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region]
    );
  }

  function selectPopularRole(role: string) {
    if (!careerGoals.includes(role)) {
      setCareerGoals([...careerGoals, role]);
    }
  }

  async function handleFinish() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create candidate profile
      const { data: candidate, error: createError } = await supabase
        .from("candidates")
        .insert({ user_id: user.id })
        .select("id")
        .single();

      if (createError) {
        // Profile might already exist
        const { data: existing } = await supabase
          .from("candidates")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (!existing) throw createError;

        // Update existing
        await supabase
          .from("candidates")
          .update({
            headline,
            languages,
            career_goals: careerGoals,
            target_regions: targetRegions,
            availability,
          })
          .eq("id", existing.id);

        // Add skills
        for (const skill of skills) {
          const { data: skillRow } = await supabase
            .from("skills")
            .select("id")
            .ilike("name", skill.skill_name)
            .single();

          if (skillRow) {
            await supabase.from("candidate_skills").upsert({
              candidate_id: existing.id,
              skill_id: skillRow.id,
              proficiency: skill.proficiency,
              source: "self_reported",
            });
          }
        }
      } else {
        // Update the new candidate
        await supabase
          .from("candidates")
          .update({
            headline,
            languages,
            career_goals: careerGoals,
            target_regions: targetRegions,
            availability,
          })
          .eq("id", candidate.id);

        // Add skills
        for (const skill of skills) {
          const { data: skillRow } = await supabase
            .from("skills")
            .select("id")
            .ilike("name", skill.skill_name)
            .single();

          if (skillRow) {
            await supabase.from("candidate_skills").upsert({
              candidate_id: candidate.id,
              skill_id: skillRow.id,
              proficiency: skill.proficiency,
              source: "self_reported",
            });
          }
        }
      }

      // Mark onboarding complete
      await supabase
        .from("users")
        .update({ onboarding_complete: true })
        .eq("id", user.id);

      toast.success("Profile created! Welcome to HirePotential 🎉");
      router.push("/candidate/dashboard");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 -left-32 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/3 -right-32 w-96 h-96 rounded-full bg-chart-2/5 blur-3xl" />
      </div>

      <div className="w-full max-w-lg relative z-10">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  i <= step
                    ? "gradient-primary text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`w-12 h-0.5 ${
                    i < step ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <Card className="glass border-border/50 animate-fade-in">
          {/* Step 1: About You */}
          {step === 0 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="w-5 h-5 text-primary" />
                  Tell us about yourself
                </CardTitle>
                <CardDescription>
                  This helps us personalize your experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Professional Headline</Label>
                  <Input
                    placeholder="e.g., Aspiring Frontend Developer"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    className="bg-input/50"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Languages</Label>
                    <Button variant="ghost" size="sm" onClick={addLanguage}>
                      <Plus className="w-3 h-3 mr-1" /> Add
                    </Button>
                  </div>
                  {languages.map((lang, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <Select
                        value={lang.language}
                        onValueChange={(val) => {
                          if (!val) return;
                          const updated = [...languages];
                          updated[i].language = val;
                          setLanguages(updated);
                        }}
                      >
                        <SelectTrigger className="bg-input/50 flex-1">
                          <SelectValue placeholder="Language" />
                        </SelectTrigger>
                        <SelectContent>
                          {LANGUAGES_LIST.map((l) => (
                            <SelectItem key={l} value={l}>{l}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={lang.level}
                        onValueChange={(val) => {
                          if (!val) return;
                          const updated = [...languages];
                          updated[i].level = val;
                          setLanguages(updated);
                        }}
                      >
                        <SelectTrigger className="bg-input/50 w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basic">Basic</SelectItem>
                          <SelectItem value="conversational">Conversational</SelectItem>
                          <SelectItem value="fluent">Fluent</SelectItem>
                          <SelectItem value="native">Native</SelectItem>
                        </SelectContent>
                      </Select>
                      {languages.length > 1 && (
                        <Button variant="ghost" size="icon" onClick={() => removeLanguage(i)} className="shrink-0">
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <Button onClick={() => setStep(1)} className="w-full gradient-primary text-white">
                  Continue <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </>
          )}

          {/* Step 2: Career Goals */}
          {step === 1 && (
            <>
              <CardHeader>
                <CardTitle>What are your career goals?</CardTitle>
                <CardDescription>
                  Select target roles and regions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Target Roles</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a role..."
                      value={goalInput}
                      onChange={(e) => setGoalInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addGoal())}
                      className="bg-input/50"
                    />
                    <Button variant="outline" onClick={addGoal}>Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {POPULAR_ROLES.filter((r) => !careerGoals.includes(r)).slice(0, 6).map((role) => (
                      <Badge
                        key={role}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary/10 hover:border-primary/40 transition-colors text-xs"
                        onClick={() => selectPopularRole(role)}
                      >
                        + {role}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {careerGoals.map((goal) => (
                      <Badge key={goal} className="gradient-primary text-white">
                        {goal}
                        <button onClick={() => setCareerGoals(careerGoals.filter((g) => g !== goal))} className="ml-1">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Target Regions</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {REGIONS.map((region) => (
                      <Badge
                        key={region}
                        variant={targetRegions.includes(region) ? "default" : "outline"}
                        className={`cursor-pointer transition-colors text-xs ${
                          targetRegions.includes(region)
                            ? "gradient-primary text-white"
                            : "hover:bg-primary/10 hover:border-primary/40"
                        }`}
                        onClick={() => toggleRegion(region)}
                      >
                        {region}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Availability</Label>
                  <Select value={availability} onValueChange={(v) => v && setAvailability(v)}>
                    <SelectTrigger className="bg-input/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediately</SelectItem>
                      <SelectItem value="1_month">Within 1 month</SelectItem>
                      <SelectItem value="3_months">Within 3 months</SelectItem>
                      <SelectItem value="6_months">Within 6 months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(0)} className="flex-1">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button
                    onClick={() => setStep(2)}
                    className="flex-1 gradient-primary text-white"
                    disabled={careerGoals.length === 0}
                  >
                    Continue <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {/* Step 3: Skills */}
          {step === 2 && (
            <>
              <CardHeader>
                <CardTitle>What skills do you have?</CardTitle>
                <CardDescription>
                  Add your current skills — we&apos;ll help you grow from here
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., JavaScript, Python, Figma..."
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                    className="bg-input/50"
                  />
                  <Button variant="outline" onClick={addSkill}>Add</Button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {skills.map((skill, i) => (
                    <div key={skill.skill_name} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                      <span className="flex-1 text-sm font-medium">{skill.skill_name}</span>
                      <Select
                        value={skill.proficiency}
                        onValueChange={(val) => {
                          if (!val) return;
                          const updated = [...skills];
                          updated[i].proficiency = val;
                          setSkills(updated);
                        }}
                      >
                        <SelectTrigger className="w-32 h-8 text-xs bg-input/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                          <SelectItem value="expert">Expert</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setSkills(skills.filter((_, idx) => idx !== i))}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>

                {skills.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No skills added yet. Don&apos;t worry — you can add more later!
                  </p>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button
                    onClick={handleFinish}
                    className="flex-1 gradient-primary text-white"
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Finish Setup
                  </Button>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
