import { createClient } from "@/lib/db/supabase.server";
import type { Employer, EmployerPlan } from "@/types";

const PLAN_VIEW_QUOTAS: Record<EmployerPlan, number> = {
  free: 20,
  startup: 100,
  growth: 500,
  enterprise: 99999,
};

export const employerService = {
  async getProfile(userId: string): Promise<Employer | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("employers")
      .select("*")
      .eq("user_id", userId)
      .single();
    if (error) return null;
    return data as Employer;
  },

  async getById(employerId: string): Promise<Employer | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("employers")
      .select("*")
      .eq("id", employerId)
      .single();
    if (error) return null;
    return data as Employer;
  },

  async updateProfile(
    employerId: string,
    data: Partial<
      Pick<
        Employer,
        | "company_name"
        | "company_size"
        | "industry"
        | "website"
        | "logo_url"
      >
    >
  ): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from("employers")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", employerId);
    if (error) throw new Error(error.message);
  },

  async uploadLogo(employerId: string, file: File): Promise<string> {
    const supabase = await createClient();
    const ext = file.name.split(".").pop();
    const path = `logos/${employerId}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });
    if (uploadError) throw new Error(uploadError.message);
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    await supabase
      .from("employers")
      .update({ logo_url: data.publicUrl })
      .eq("id", employerId);
    return data.publicUrl;
  },

  async getPlan(employerId: string): Promise<{
    plan: EmployerPlan;
    viewsRemaining: number;
    teamSeats: number;
  }> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("employers")
      .select("plan, candidate_views_remaining, team_seats")
      .eq("id", employerId)
      .single();
    if (error) throw new Error(error.message);
    return {
      plan: data.plan as EmployerPlan,
      viewsRemaining: data.candidate_views_remaining,
      teamSeats: data.team_seats,
    };
  },

  async decrementViewCount(employerId: string): Promise<number> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("employers")
      .select("candidate_views_remaining")
      .eq("id", employerId)
      .single();
    if (error) throw new Error(error.message);
    if (data.candidate_views_remaining <= 0) {
      throw new Error("No candidate views remaining. Please upgrade your plan.");
    }
    const newCount = data.candidate_views_remaining - 1;
    await supabase
      .from("employers")
      .update({ candidate_views_remaining: newCount })
      .eq("id", employerId);
    return newCount;
  },

  async createEmployer(
    userId: string,
    data: {
      company_name: string;
      company_size: Employer["company_size"];
      industry: string;
      website?: string;
    }
  ): Promise<Employer> {
    const supabase = await createClient();
    const { data: employer, error } = await supabase
      .from("employers")
      .insert({
        user_id: userId,
        company_name: data.company_name,
        company_size: data.company_size,
        industry: data.industry,
        website: data.website ?? null,
        plan: "free",
        team_seats: 1,
        candidate_views_remaining: PLAN_VIEW_QUOTAS.free,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    // Mark user onboarding complete
    await supabase
      .from("users")
      .update({ onboarding_complete: true })
      .eq("id", userId);
    return employer as Employer;
  },
};
