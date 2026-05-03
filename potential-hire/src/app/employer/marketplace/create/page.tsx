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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Skill } from "@/types";
import { ArrowLeft, Briefcase, Sparkles, Plus, X, DollarSign, Wifi, Users, Clock } from "lucide-react";

const schema = z.object({
  title: z.string().min(3),
  description: z.string().min(100, "Description must be at least 100 characters"),
  category: z.enum(["data_analysis", "ui_design", "content", "dev", "research", "marketing", "other"]),
  duration_weeks: z.number().min(2).max(4),
  is_paid: z.boolean(),
  compensation: z.number().optional(),
  is_remote: z.boolean(),
  max_applicants: z.number().min(1).max(50),
});

type FormData = z.infer<typeof schema>;

export default function CreateInternshipPage() {
  const router = useRouter();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);
  const [skillSearch, setSkillSearch] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [isRemote, setIsRemote] = useState(true);
  const [duration, setDuration] = useState(2);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", description: "", category: "dev", duration_weeks: 2, is_paid: false, is_remote: true, max_applicants: 5 },
  });

  useEffect(() => {
    fetch("/api/skills").then(r => r.json()).then(d => setSkills(d.skills ?? []));
  }, []);

  const filteredSkills = skills.filter(s =>
    s.name.toLowerCase().includes(skillSearch.toLowerCase()) && !selectedSkills.find(sel => sel.id === s.id)
  ).slice(0, 8);

  async function onSubmit(data: FormData) {
    setIsLoading(true);
    try {
      const res = await fetch("/api/marketplace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, duration_weeks: duration, is_paid: isPaid, is_remote: isRemote, skills_required: selectedSkills.map(s => s.id) }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create");
      }
      toast.success("Internship posted successfully!");
      router.push("/employer/marketplace");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create internship");
    } finally { setIsLoading(false); }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-1" />Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Post Micro-Internship</h1>
          <p className="text-sm text-muted-foreground">Trial top talent with a focused 2–4 week project</p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="glass rounded-xl p-6 space-y-5">
          <h2 className="font-semibold flex items-center gap-2"><Briefcase className="w-4 h-4 text-primary" />Project Details</h2>
          <div className="space-y-2">
            <Label htmlFor="title">Project Title *</Label>
            <Input id="title" placeholder="e.g. Build a dashboard UI, Analyze customer data" {...form.register("title")} />
            {form.formState.errors.title && <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select onValueChange={(v) => form.setValue("category", v as FormData["category"])} defaultValue="dev">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[["dev","Development"],["data_analysis","Data Analysis"],["ui_design","UI Design"],["content","Content"],["research","Research"],["marketing","Marketing"],["other","Other"]].map(([v,l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />Max Applicants</Label>
              <Input type="number" min={1} max={50} defaultValue={5} {...form.register("max_applicants", { valueAsNumber: true })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description * <span className="text-muted-foreground text-xs">(min 100 chars)</span></Label>
            <Textarea id="description" rows={5} placeholder="Describe the project, deliverables, and what success looks like..." {...form.register("description")} />
            {form.formState.errors.description && <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>}
          </div>
        </div>

        <div className="glass rounded-xl p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2"><Clock className="w-4 h-4 text-primary" />Timeline & Compensation</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Duration</Label>
              <span className="text-primary font-bold">{duration} week{duration > 1 ? "s" : ""}</span>
            </div>
            <input type="range" min={2} max={4} value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full accent-primary" />
            <div className="flex justify-between text-xs text-muted-foreground"><span>2 weeks (min)</span><span>4 weeks (max)</span></div>
          </div>
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
            <div className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-muted-foreground" /><span className="text-sm font-medium">Paid Internship</span></div>
            <button type="button" onClick={() => setIsPaid(!isPaid)} className={`relative w-12 h-6 rounded-full transition-colors ${isPaid ? "bg-primary" : "bg-muted"}`}>
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${isPaid ? "translate-x-7" : "translate-x-1"}`} />
            </button>
          </div>
          {isPaid && (
            <div className="space-y-2">
              <Label>Compensation (USD)</Label>
              <Input type="number" placeholder="e.g. 500" {...form.register("compensation", { valueAsNumber: true })} />
            </div>
          )}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
            <div className="flex items-center gap-2"><Wifi className="w-4 h-4 text-muted-foreground" /><span className="text-sm font-medium">Remote</span></div>
            <button type="button" onClick={() => setIsRemote(!isRemote)} className={`relative w-12 h-6 rounded-full transition-colors ${isRemote ? "bg-primary" : "bg-muted"}`}>
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${isRemote ? "translate-x-7" : "translate-x-1"}`} />
            </button>
          </div>
        </div>

        <div className="glass rounded-xl p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" />Required Skills</h2>
          {selectedSkills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedSkills.map(s => (
                <Badge key={s.id} className="bg-primary/20 text-primary cursor-pointer" onClick={() => setSelectedSkills(prev => prev.filter(x => x.id !== s.id))}>
                  {s.name} <X className="w-3 h-3 ml-1" />
                </Badge>
              ))}
            </div>
          )}
          <Input placeholder="Search skills..." value={skillSearch} onChange={(e) => setSkillSearch(e.target.value)} />
          {skillSearch && filteredSkills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {filteredSkills.map(skill => (
                <button key={skill.id} type="button" onClick={() => { setSelectedSkills(prev => [...prev, skill]); setSkillSearch(""); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted hover:bg-primary/10 hover:text-primary text-sm transition-colors">
                  <Plus className="w-3 h-3" />{skill.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <Button type="submit" className="w-full gradient-primary text-white" size="lg" disabled={isLoading}>
          {isLoading ? "Posting..." : "Post Internship"}
          <Briefcase className="ml-2 w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}
