import { createClient } from "@/lib/db/supabase.server";
import type { Candidate, CandidateSkill, LanguageEntry } from "@/types";

export const candidateService = {
  async getProfile(userId: string) {
    const supabase = await createClient();

    const { data: candidate, error } = await supabase
      .from("candidates")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return candidate as Candidate | null;
  },

  async createProfile(userId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("candidates")
      .insert({ user_id: userId })
      .select()
      .single();

    if (error) throw error;
    return data as Candidate;
  },

  async updateProfile(
    candidateId: string,
    data: Partial<{
      headline: string;
      career_goals: string[];
      target_regions: string[];
      salary_min: number | null;
      salary_max: number | null;
      languages: LanguageEntry[];
      portfolio_links: string[];
      availability: string;
      is_public: boolean;
      resume_url: string;
      resume_parsed: Record<string, unknown>;
    }>
  ) {
    const supabase = await createClient();

    const { error } = await supabase
      .from("candidates")
      .update(data)
      .eq("id", candidateId);

    if (error) throw error;
  },

  async getSkills(candidateId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("candidate_skills")
      .select("*, skill:skills(*)")
      .eq("candidate_id", candidateId);

    if (error) throw error;
    return (data || []) as (CandidateSkill & { skill: { name: string; category: string } })[];
  },

  async addSkill(
    candidateId: string,
    skillId: string,
    proficiency: string,
    source: string = "self_reported"
  ) {
    const supabase = await createClient();

    const { error } = await supabase.from("candidate_skills").upsert({
      candidate_id: candidateId,
      skill_id: skillId,
      proficiency,
      source,
      verified: source !== "self_reported",
    });

    if (error) throw error;
  },

  async removeSkill(candidateId: string, skillId: string) {
    const supabase = await createClient();

    const { error } = await supabase
      .from("candidate_skills")
      .delete()
      .eq("candidate_id", candidateId)
      .eq("skill_id", skillId);

    if (error) throw error;
  },

  async findOrCreateSkill(skillName: string, category: string = "technical") {
    const supabase = await createClient();

    // Try to find existing skill
    const { data: existing } = await supabase
      .from("skills")
      .select("id")
      .ilike("name", skillName)
      .single();

    if (existing) return existing.id;

    // Create new skill
    const { data: newSkill, error } = await supabase
      .from("skills")
      .insert({ name: skillName, category })
      .select("id")
      .single();

    if (error) throw error;
    return newSkill.id;
  },

  async completeOnboarding(userId: string) {
    const supabase = await createClient();

    const { error } = await supabase
      .from("users")
      .update({ onboarding_complete: true })
      .eq("id", userId);

    if (error) throw error;
  },

  async getProfileCompleteness(candidateId: string): Promise<number> {
    const supabase = await createClient();

    const { data: candidate } = await supabase
      .from("candidates")
      .select("*")
      .eq("id", candidateId)
      .single();

    if (!candidate) return 0;

    let score = 0;
    const total = 8;

    if (candidate.headline) score++;
    if (candidate.career_goals?.length > 0) score++;
    if (candidate.target_regions?.length > 0) score++;
    if (candidate.languages?.length > 0) score++;
    if (candidate.resume_url) score++;
    if (candidate.portfolio_links?.length > 0) score++;
    if (candidate.salary_min || candidate.salary_max) score++;

    // Check skills
    const { count } = await supabase
      .from("candidate_skills")
      .select("*", { count: "exact", head: true })
      .eq("candidate_id", candidateId);

    if (count && count > 0) score++;

    return Math.round((score / total) * 100);
  },
};
