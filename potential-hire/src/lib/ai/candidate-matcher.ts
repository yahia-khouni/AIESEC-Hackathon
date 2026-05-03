import type { CandidateProfile, JobPost, BlindCandidate, CandidateAvailability } from "@/types";

interface MatchBreakdown {
  roleFit: number;
  growthTrajectory: number;
  availabilityMatch: number;
  regionFit: number;
  salaryFit: number;
  languageFit: number;
}

interface MatchResult {
  totalScore: number;
  breakdown: MatchBreakdown;
}

const AVAILABILITY_WEIGHTS: Record<CandidateAvailability, number> = {
  immediate: 1.0,
  "1_month": 0.9,
  "3_months": 0.7,
  "6_months": 0.5,
};

export async function computeMatchScore(
  candidate: BlindCandidate,
  jobPost: JobPost
): Promise<MatchResult> {
  // 1. Role Fit — skill overlap percentage
  const candidateSkillIds = candidate.skills.map((s) => s.skill_id);
  const requiredSkillIds = jobPost.required_skills ?? [];
  const overlap =
    requiredSkillIds.length === 0
      ? 0.8 // No skills required = decent baseline match
      : candidateSkillIds.filter((id) => requiredSkillIds.includes(id)).length /
        requiredSkillIds.length;
  const roleFit = Math.min(1, overlap) * 100;

  // 2. Growth Trajectory — if score is good, assume positive trajectory
  const score = candidate.potential_score ?? 50;
  const growthTrajectory = score >= 70 ? 80 : score >= 50 ? 60 : 40;

  // 3. Availability Match
  const availabilityMatch =
    (AVAILABILITY_WEIGHTS[candidate.availability] ?? 0.5) * 100;

  // 4. Region Fit
  let regionFit = 50; // default
  if (!jobPost.region || jobPost.region.toLowerCase().includes("remote")) {
    regionFit = 90;
  } else if (
    candidate.region &&
    candidate.region.toLowerCase().includes(jobPost.region.toLowerCase())
  ) {
    regionFit = 100;
  } else {
    regionFit = 60; // different region but might relocate
  }

  // 5. Salary Fit
  let salaryFit = 75; // default when no salary data
  // (In full implementation, compare candidate.salary_min/max with job.salary_min/max)

  // 6. Language Fit — default decent match
  const languageFit = 75;

  const totalScore =
    roleFit * 0.3 +
    growthTrajectory * 0.2 +
    availabilityMatch * 0.15 +
    regionFit * 0.15 +
    salaryFit * 0.1 +
    languageFit * 0.1;

  return {
    totalScore: Math.round(totalScore),
    breakdown: {
      roleFit: Math.round(roleFit),
      growthTrajectory: Math.round(growthTrajectory),
      availabilityMatch: Math.round(availabilityMatch),
      regionFit: Math.round(regionFit),
      salaryFit: Math.round(salaryFit),
      languageFit: Math.round(languageFit),
    },
  };
}
