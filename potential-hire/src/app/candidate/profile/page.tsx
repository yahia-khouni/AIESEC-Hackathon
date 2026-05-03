"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabase } from "@/lib/db/supabase.browser";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { UserCircle, Loader2, Save, Plus, X } from "lucide-react";

export default function ProfilePage() {
  const supabase = createBrowserSupabase();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [skills, setSkills] = useState<{ skill: { name: string }; proficiency: string }[]>([]);
  const [formData, setFormData] = useState({
    headline: "",
    career_goals: [] as string[],
    target_regions: [] as string[],
    salary_min: "",
    salary_max: "",
    availability: "immediate",
    portfolio_links: [] as string[],
    is_public: false,
  });
  const [newLink, setNewLink] = useState("");
  const [newGoal, setNewGoal] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/candidates/profile");
        const data = await res.json();
        if (data.profile) {
          setProfile(data.profile);
          setSkills(data.skills || []);
          setFormData({
            headline: data.profile.headline || "",
            career_goals: data.profile.career_goals || [],
            target_regions: data.profile.target_regions || [],
            salary_min: data.profile.salary_min?.toString() || "",
            salary_max: data.profile.salary_max?.toString() || "",
            availability: data.profile.availability || "immediate",
            portfolio_links: data.profile.portfolio_links || [],
            is_public: data.profile.is_public || false,
          });
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/candidates/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          salary_min: formData.salary_min ? parseInt(formData.salary_min) : null,
          salary_max: formData.salary_max ? parseInt(formData.salary_max) : null,
        }),
      });
      if (res.ok) {
        toast.success("Profile updated!");
      } else {
        toast.error("Failed to update profile");
      }
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <UserCircle className="w-6 h-6 text-primary" />
            Profile
          </h1>
          <p className="text-muted-foreground mt-1">Manage your professional profile</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gradient-primary text-white">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      {/* Basic Info */}
      <Card className="border-border/30">
        <CardHeader><CardTitle className="text-base">Basic Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Professional Headline</Label>
            <Input
              value={formData.headline}
              onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
              placeholder="e.g., Aspiring Full-Stack Developer"
              className="bg-input/50"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Minimum Salary (USD/yr)</Label>
              <Input type="number" value={formData.salary_min} onChange={(e) => setFormData({ ...formData, salary_min: e.target.value })} className="bg-input/50" placeholder="30000" />
            </div>
            <div className="space-y-2">
              <Label>Maximum Salary (USD/yr)</Label>
              <Input type="number" value={formData.salary_max} onChange={(e) => setFormData({ ...formData, salary_max: e.target.value })} className="bg-input/50" placeholder="60000" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Availability</Label>
            <Select value={formData.availability} onValueChange={(v) => v && setFormData({ ...formData, availability: v })}>
              <SelectTrigger className="bg-input/50"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Immediately</SelectItem>
                <SelectItem value="1_month">Within 1 month</SelectItem>
                <SelectItem value="3_months">Within 3 months</SelectItem>
                <SelectItem value="6_months">Within 6 months</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="is_public" checked={formData.is_public} onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })} className="rounded" />
            <Label htmlFor="is_public">Make profile visible to employers</Label>
          </div>
        </CardContent>
      </Card>

      {/* Career Goals */}
      <Card className="border-border/30">
        <CardHeader><CardTitle className="text-base">Career Goals</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input value={newGoal} onChange={(e) => setNewGoal(e.target.value)} placeholder="Add a target role..." className="bg-input/50" onKeyDown={(e) => { if (e.key === "Enter" && newGoal.trim()) { setFormData({ ...formData, career_goals: [...formData.career_goals, newGoal.trim()] }); setNewGoal(""); }}} />
            <Button variant="outline" onClick={() => { if (newGoal.trim()) { setFormData({ ...formData, career_goals: [...formData.career_goals, newGoal.trim()] }); setNewGoal(""); }}}><Plus className="w-4 h-4" /></Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.career_goals.map((goal) => (
              <Badge key={goal} className="gradient-primary text-white">
                {goal}
                <button className="ml-1" onClick={() => setFormData({ ...formData, career_goals: formData.career_goals.filter((g) => g !== goal) })}><X className="w-3 h-3" /></button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Skills */}
      <Card className="border-border/30">
        <CardHeader><CardTitle className="text-base">Skills</CardTitle></CardHeader>
        <CardContent>
          {skills.length === 0 ? (
            <p className="text-sm text-muted-foreground">No skills added yet. Complete onboarding or add via assessments.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {skills.map((s, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {s.skill?.name || "Unknown"} · <span className="capitalize">{s.proficiency}</span>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Portfolio Links */}
      <Card className="border-border/30">
        <CardHeader><CardTitle className="text-base">Portfolio Links</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input value={newLink} onChange={(e) => setNewLink(e.target.value)} placeholder="https://github.com/..." className="bg-input/50" />
            <Button variant="outline" onClick={() => { if (newLink.trim()) { setFormData({ ...formData, portfolio_links: [...formData.portfolio_links, newLink.trim()] }); setNewLink(""); }}}><Plus className="w-4 h-4" /></Button>
          </div>
          {formData.portfolio_links.map((link, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/20">
              <span className="flex-1 text-sm truncate">{link}</span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setFormData({ ...formData, portfolio_links: formData.portfolio_links.filter((_, idx) => idx !== i) })}><X className="w-3 h-3" /></Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
