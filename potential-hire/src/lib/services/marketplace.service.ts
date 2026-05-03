import { createClient } from "@/lib/db/supabase.server";
import type { Internship, InternshipApplication, InternshipCategory } from "@/types";

export interface NewInternship {
  title: string;
  description: string;
  category: InternshipCategory;
  duration_weeks: number;
  is_paid: boolean;
  compensation?: number;
  is_remote: boolean;
  max_applicants: number;
  skills_required: string[];
}

export interface MarketplaceFilters {
  category?: InternshipCategory;
  is_paid?: boolean;
  is_remote?: boolean;
  skills?: string[];
  duration_min?: number;
  duration_max?: number;
}

export const marketplaceService = {
  async createInternship(
    employerId: string,
    data: NewInternship
  ): Promise<Internship> {
    const supabase = await createClient();
    const { data: internship, error } = await supabase
      .from("internships")
      .insert({
        employer_id: employerId,
        title: data.title,
        description: data.description,
        category: data.category,
        duration_weeks: data.duration_weeks,
        is_paid: data.is_paid,
        compensation: data.is_paid ? (data.compensation ?? null) : null,
        is_remote: data.is_remote,
        max_applicants: data.max_applicants,
        skills_required: data.skills_required,
        status: "open",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return internship as Internship;
  },

  async listOpen(filters?: MarketplaceFilters): Promise<Internship[]> {
    const supabase = await createClient();
    let query = supabase
      .from("internships")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: false });

    if (filters?.category) query = query.eq("category", filters.category);
    if (filters?.is_paid !== undefined) query = query.eq("is_paid", filters.is_paid);
    if (filters?.is_remote !== undefined) query = query.eq("is_remote", filters.is_remote);
    if (filters?.duration_min) query = query.gte("duration_weeks", filters.duration_min);
    if (filters?.duration_max) query = query.lte("duration_weeks", filters.duration_max);

    const { data, error } = await query.limit(50);
    if (error) throw new Error(error.message);
    return (data ?? []) as Internship[];
  },

  async apply(candidateId: string, internshipId: string, coverMessage?: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.from("internship_applications").insert({
      internship_id: internshipId,
      candidate_id: candidateId,
      status: "applied",
    });
    if (error) throw new Error(error.message);
  },

  async getApplicants(internshipId: string): Promise<InternshipApplication[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("internship_applications")
      .select("*, candidates(id, potential_score, availability, target_regions, candidate_skills(*, skills(*)))")
      .eq("internship_id", internshipId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as InternshipApplication[];
  },

  async acceptApplicant(applicationId: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from("internship_applications")
      .update({ status: "accepted" })
      .eq("id", applicationId);
    if (error) throw new Error(error.message);
  },

  async rejectApplicant(applicationId: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from("internship_applications")
      .update({ status: "rejected" })
      .eq("id", applicationId);
    if (error) throw new Error(error.message);
  },

  async submitWork(applicationId: string, submissionUrl: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from("internship_applications")
      .update({ submission_url: submissionUrl })
      .eq("id", applicationId);
    if (error) throw new Error(error.message);
  },

  async rateEmployer(applicationId: string, rating: number): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from("internship_applications")
      .update({ candidate_rating: rating })
      .eq("id", applicationId);
    if (error) throw new Error(error.message);
  },

  async rateCandidate(
    applicationId: string,
    rating: number,
    review: string
  ): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from("internship_applications")
      .update({
        employer_rating: rating,
        employer_review: review,
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", applicationId);
    if (error) throw new Error(error.message);
  },

  async getByEmployer(employerId: string): Promise<Internship[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("internships")
      .select("*")
      .eq("employer_id", employerId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as Internship[];
  },

  async getByCandidate(candidateId: string): Promise<InternshipApplication[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("internship_applications")
      .select("*, internships(*)")
      .eq("candidate_id", candidateId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as InternshipApplication[];
  },
};
