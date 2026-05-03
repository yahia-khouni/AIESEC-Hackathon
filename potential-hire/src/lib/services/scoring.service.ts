import { createClient } from "@/lib/db/supabase.server";
import type { PotentialScore } from "@/types";

const WEIGHTS = {
  learning_velocity: 0.2,
  skill_gap_closure: 0.18,
  assessment_performance: 0.15,
  project_consistency: 0.12,
  credential_quality: 0.1,
  roadmap_progress: 0.1,
  simulation_performance: 0.08,
  employer_feedback: 0.07,
};

export const scoringService = {
  async computeScore(candidateId: string): Promise<PotentialScore> {
    const supabase = await createClient();

    // 1. Gather all inputs
    const [credentials, assessments, roadmap, internships, skills] =
      await Promise.all([
        supabase
          .from("credentials")
          .select("*")
          .eq("candidate_id", candidateId),
        supabase
          .from("assessments")
          .select("*")
          .eq("candidate_id", candidateId),
        supabase
          .from("roadmaps")
          .select("*")
          .eq("candidate_id", candidateId)
          .eq("status", "active")
          .single(),
        supabase
          .from("internship_applications")
          .select("*")
          .eq("candidate_id", candidateId)
          .eq("status", "completed"),
        supabase
          .from("candidate_skills")
          .select("*")
          .eq("candidate_id", candidateId),
      ]);

    const creds = credentials.data || [];
    const assessmentList = assessments.data || [];
    const activeRoadmap = roadmap.data;
    const completedInternships = internships.data || [];
    const candidateSkills = skills.data || [];

    // 2. Compute sub-scores (0-100)

    // Learning Velocity: credentials per month, normalized (more = higher)
    const credentialCount = creds.length;
    const learningVelocity = Math.min(credentialCount * 15, 100);

    // Skill Gap Closure: % of skills that are verified
    const verifiedSkills = candidateSkills.filter((s) => s.verified).length;
    const totalSkills = candidateSkills.length || 1;
    const skillGapClosure = Math.round((verifiedSkills / totalSkills) * 100);

    // Assessment Performance: average assessment score
    const assessmentScores = assessmentList.map(
      (a) => (a.score / a.max_score) * 100
    );
    const assessmentPerformance =
      assessmentScores.length > 0
        ? Math.round(
            assessmentScores.reduce((a, b) => a + b, 0) /
              assessmentScores.length
          )
        : 0;

    // Project Consistency: based on regular activity
    const projectConsistency = Math.min(
      (completedInternships.length * 25) + (credentialCount * 10),
      100
    );

    // Credential Quality: weighted by verification status
    const verifiedCreds = creds.filter((c) => c.verified).length;
    const credentialQuality =
      creds.length > 0
        ? Math.round((verifiedCreds / creds.length) * 80 + Math.min(creds.length * 5, 20))
        : 0;

    // Roadmap Progress: completion percentage of active roadmap
    const roadmapProgress = activeRoadmap
      ? Math.round(activeRoadmap.completion_pct)
      : 0;

    // Simulation Performance: average employer rating from internships (1-5 → 0-100)
    const ratings = completedInternships
      .filter((i) => i.employer_rating)
      .map((i) => i.employer_rating * 20);
    const simulationPerformance =
      ratings.length > 0
        ? Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length)
        : 0;

    // Employer Feedback: based on reviews
    const reviewedInternships = completedInternships.filter(
      (i) => i.employer_review
    );
    const employerFeedback =
      reviewedInternships.length > 0
        ? Math.min(reviewedInternships.length * 20, 100)
        : 0;

    // 3. Compute weighted total
    const totalScore = Math.round(
      learningVelocity * WEIGHTS.learning_velocity +
        skillGapClosure * WEIGHTS.skill_gap_closure +
        assessmentPerformance * WEIGHTS.assessment_performance +
        projectConsistency * WEIGHTS.project_consistency +
        credentialQuality * WEIGHTS.credential_quality +
        roadmapProgress * WEIGHTS.roadmap_progress +
        simulationPerformance * WEIGHTS.simulation_performance +
        employerFeedback * WEIGHTS.employer_feedback
    );

    // 4. Save to potential_scores table
    const scoreData = {
      candidate_id: candidateId,
      total_score: totalScore,
      learning_velocity: learningVelocity,
      skill_gap_closure: skillGapClosure,
      assessment_performance: assessmentPerformance,
      project_consistency: projectConsistency,
      credential_quality: credentialQuality,
      roadmap_progress: roadmapProgress,
      simulation_performance: simulationPerformance,
      employer_feedback: employerFeedback,
      model_version: "v1.0",
    };

    const { data: score, error: scoreError } = await supabase
      .from("potential_scores")
      .insert(scoreData)
      .select()
      .single();

    if (scoreError) throw scoreError;

    // 5. Update denormalized score on candidate
    await supabase
      .from("candidates")
      .update({
        potential_score: totalScore,
        score_updated_at: new Date().toISOString(),
      })
      .eq("id", candidateId);

    return score as PotentialScore;
  },

  async getLatestScore(candidateId: string): Promise<PotentialScore | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("potential_scores")
      .select("*")
      .eq("candidate_id", candidateId)
      .order("computed_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data as PotentialScore | null;
  },

  async getScoreHistory(
    candidateId: string,
    limit: number = 30
  ): Promise<PotentialScore[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("potential_scores")
      .select("*")
      .eq("candidate_id", candidateId)
      .order("computed_at", { ascending: true })
      .limit(limit);

    if (error) throw error;
    return (data || []) as PotentialScore[];
  },
};
