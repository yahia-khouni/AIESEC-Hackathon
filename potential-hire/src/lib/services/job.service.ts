import { createClient } from "@/lib/db/supabase.server";
import type { JobPost, JobStatus, JobType } from "@/types";

export interface NewJobPost {
  title: string;
  description: string;
  required_skills: string[];
  min_potential_score: number;
  region: string;
  salary_min?: number;
  salary_max?: number;
  type: JobType;
  blind_mode: boolean;
  status: JobStatus;
}

export const jobService = {
  async create(employerId: string, data: NewJobPost): Promise<JobPost> {
    const supabase = await createClient();
    const { data: job, error } = await supabase
      .from("job_posts")
      .insert({
        employer_id: employerId,
        title: data.title,
        description: data.description,
        required_skills: data.required_skills,
        min_potential_score: data.min_potential_score,
        region: data.region,
        salary_min: data.salary_min ?? null,
        salary_max: data.salary_max ?? null,
        type: data.type,
        blind_mode: data.blind_mode,
        status: data.status,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return job as JobPost;
  },

  async update(jobId: string, data: Partial<NewJobPost>): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from("job_posts")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", jobId);
    if (error) throw new Error(error.message);
  },

  async getByEmployer(employerId: string): Promise<JobPost[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("job_posts")
      .select("*")
      .eq("employer_id", employerId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as JobPost[];
  },

  async getById(jobId: string): Promise<JobPost | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("job_posts")
      .select("*")
      .eq("id", jobId)
      .single();
    if (error) return null;
    return data as JobPost;
  },

  async close(jobId: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from("job_posts")
      .update({ status: "closed", updated_at: new Date().toISOString() })
      .eq("id", jobId);
    if (error) throw new Error(error.message);
  },

  async duplicate(jobId: string, employerId: string): Promise<JobPost> {
    const original = await jobService.getById(jobId);
    if (!original) throw new Error("Job not found");
    return jobService.create(employerId, {
      title: `${original.title} (Copy)`,
      description: original.description,
      required_skills: original.required_skills,
      min_potential_score: original.min_potential_score,
      region: original.region,
      salary_min: original.salary_min ?? undefined,
      salary_max: original.salary_max ?? undefined,
      type: original.type,
      blind_mode: original.blind_mode,
      status: "draft",
    });
  },

  async getApplicationCount(jobId: string): Promise<number> {
    const supabase = await createClient();
    const { count, error } = await supabase
      .from("internship_applications")
      .select("id", { count: "exact", head: true })
      .eq("internship_id", jobId);
    if (error) return 0;
    return count ?? 0;
  },

  async listActiveJobs(): Promise<JobPost[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("job_posts")
      .select(`
        *,
        employers:employer_id ( company_name )
      `)
      .eq("status", "active")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    
    // Map employer company_name to a company property if needed,
    // or we can just return it. The frontend might need company name.
    return (data ?? []).map((job: any) => ({
      ...job,
      company: job.employers?.company_name || "Confidential",
    })) as JobPost[];
  },
};
