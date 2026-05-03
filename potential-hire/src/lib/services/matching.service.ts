import { createClient } from "@/lib/db/supabase.server";
import type { BlindCandidate, Candidate, CandidateSkill, JobPost, PotentialScore } from "@/types";
import { computeMatchScore } from "@/lib/ai/candidate-matcher";

export interface SearchFilters {
  minScore?: number;
  skills?: string[];
  region?: string;
  availability?: string;
  languages?: string[];
  sortBy?: "match_score" | "potential_score" | "recent";
  jobId?: string;
}

export interface BlindCandidateWithMatch extends BlindCandidate {
  matchScore?: number;
  matchBreakdown?: {
    roleFit: number;
    growthTrajectory: number;
    availabilityMatch: number;
    regionFit: number;
    salaryFit: number;
    languageFit: number;
  };
}

export const matchingService = {
  async searchCandidates(
    filters: SearchFilters,
    _employerId: string
  ): Promise<BlindCandidateWithMatch[]> {
    const supabase = await createClient();

    let query = supabase
      .from("candidates")
      .select(
        `
        id,
        availability,
        potential_score,
        target_regions,
        languages,
        is_public,
        candidate_skills(
          skill_id,
          proficiency,
          verified,
          source,
          skills(id, name, category)
        ),
        potential_scores(
          total_score,
          learning_velocity,
          skill_gap_closure,
          assessment_performance,
          project_consistency,
          credential_quality,
          roadmap_progress,
          simulation_performance,
          employer_feedback
        ),
        roadmaps(completion_pct),
        credentials(id)
      `
      )
      .eq("is_public", true);

    if (filters.minScore !== undefined && filters.minScore > 0) {
      query = query.gte("potential_score", filters.minScore);
    }
    if (filters.availability) {
      query = query.eq("availability", filters.availability);
    }

    const { data, error } = await query.limit(50);
    if (error) throw new Error(error.message);

    // Build blind candidate cards
    let candidates: BlindCandidateWithMatch[] = (data ?? []).map((c: any) => {
      const latestScore = c.potential_scores?.[0] ?? null;
      const roadmapCompletion = c.roadmaps?.[0]?.completion_pct ?? 0;
      const region =
        Array.isArray(c.target_regions) && c.target_regions.length > 0
          ? c.target_regions[0]
          : "Global";

      return {
        id: c.id,
        potential_score: c.potential_score,
        score: latestScore,
        skills: (c.candidate_skills ?? []).map((cs: any) => ({
          candidate_id: c.id,
          skill_id: cs.skill_id,
          proficiency: cs.proficiency,
          verified: cs.verified,
          source: cs.source,
          skill: cs.skills,
        })) as CandidateSkill[],
        availability: c.availability,
        region,
        languages: c.languages ?? [],
        roadmap_completion: roadmapCompletion,
        credential_count: (c.credentials ?? []).length,
      };
    });

    // Filter by skills if provided
    if (filters.skills && filters.skills.length > 0) {
      candidates = candidates.filter((c) =>
        filters.skills!.some((skillId) =>
          c.skills.some((cs) => cs.skill_id === skillId)
        )
      );
    }

    // Filter by region
    if (filters.region) {
      candidates = candidates.filter((c) =>
        c.region.toLowerCase().includes(filters.region!.toLowerCase()) ||
        filters.region!.toLowerCase().includes("remote")
      );
    }

    // Compute match scores if job context provided
    if (filters.jobId) {
      const { data: jobData } = await supabase
        .from("job_posts")
        .select("*")
        .eq("id", filters.jobId)
        .single();

      if (jobData) {
        const jobPost = jobData as JobPost;
        candidates = await Promise.all(
          candidates.map(async (c) => {
            const match = await computeMatchScore(c, jobPost);
            return {
              ...c,
              matchScore: match.totalScore,
              matchBreakdown: match.breakdown,
            };
          })
        );
      }
    }

    // Sort
    if (filters.sortBy === "match_score" && filters.jobId) {
      candidates.sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
    } else if (filters.sortBy === "potential_score") {
      candidates.sort((a, b) => (b.potential_score ?? 0) - (a.potential_score ?? 0));
    } else {
      // Default: by score
      candidates.sort((a, b) => (b.potential_score ?? 0) - (a.potential_score ?? 0));
    }

    return candidates;
  },

  async revealCandidate(
    employerId: string,
    candidateId: string
  ): Promise<{ candidate: any; user: any }> {
    const supabase = await createClient();

    // Decrement view count
    const { data: emp } = await supabase
      .from("employers")
      .select("candidate_views_remaining")
      .eq("id", employerId)
      .single();

    if (!emp || emp.candidate_views_remaining <= 0) {
      throw new Error("No candidate views remaining. Please upgrade your plan.");
    }

    await supabase
      .from("employers")
      .update({ candidate_views_remaining: emp.candidate_views_remaining - 1 })
      .eq("id", employerId);

    // Fetch full candidate profile with user data
    const { data, error } = await supabase
      .from("candidates")
      .select(
        `*, users(id, full_name, email, avatar_url), candidate_skills(*, skills(*))`
      )
      .eq("id", candidateId)
      .single();

    if (error || !data) throw new Error("Candidate not found");

    return { candidate: data, user: (data as any).users };
  },

  async getMatchScore(
    candidateId: string,
    jobId: string
  ): Promise<{ totalScore: number; breakdown: object }> {
    const supabase = await createClient();

    const [{ data: candidateData }, { data: jobData }] = await Promise.all([
      supabase
        .from("candidates")
        .select(`*, candidate_skills(*, skills(*)), potential_scores(*)`)
        .eq("id", candidateId)
        .single(),
      supabase.from("job_posts").select("*").eq("id", jobId).single(),
    ]);

    if (!candidateData || !jobData) {
      return { totalScore: 0, breakdown: {} };
    }

    const blindCandidate: BlindCandidate = {
      id: candidateData.id,
      potential_score: candidateData.potential_score,
      score: candidateData.potential_scores?.[0] ?? null,
      skills: candidateData.candidate_skills ?? [],
      availability: candidateData.availability,
      region: candidateData.target_regions?.[0] ?? "Global",
      languages: candidateData.languages ?? [],
      roadmap_completion: 0,
      credential_count: 0,
    };

    return computeMatchScore(blindCandidate, jobData as JobPost);
  },

  async getRecommendations(
    employerId: string,
    jobId: string
  ): Promise<BlindCandidateWithMatch[]> {
    const candidates = await matchingService.searchCandidates(
      { sortBy: "match_score", jobId },
      employerId
    );
    return candidates.slice(0, 5);
  },
};
