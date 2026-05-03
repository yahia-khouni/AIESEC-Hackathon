// ============================================================
// PotentialHire — Shared TypeScript Types
// ============================================================

// ---- Enums ----

export type UserRole = "candidate" | "employer" | "institution" | "admin";

export type CandidateAvailability =
  | "immediate"
  | "1_month"
  | "3_months"
  | "6_months";

export type SkillProficiency =
  | "beginner"
  | "intermediate"
  | "advanced"
  | "expert";

export type SkillSource =
  | "self_reported"
  | "ai_extracted"
  | "assessment"
  | "credential";

export type SkillCategory = "technical" | "soft" | "domain";

export type RoadmapStatus = "active" | "completed" | "paused";

export type AssessmentType = "quiz" | "project" | "simulation" | "peer_review";

export type CredentialProvider =
  | "coursera"
  | "udemy"
  | "freecodecamp"
  | "university"
  | "internal"
  | "other";

export type JobType =
  | "full_time"
  | "part_time"
  | "contract"
  | "internship";

export type JobStatus = "draft" | "active" | "closed";

export type CompanySize = "startup" | "sme" | "enterprise";

export type EmployerPlan = "free" | "startup" | "growth" | "enterprise";

export type InternshipStatus =
  | "open"
  | "in_progress"
  | "completed"
  | "cancelled";

export type InternshipCategory =
  | "data_analysis"
  | "ui_design"
  | "content"
  | "dev"
  | "research"
  | "marketing"
  | "other";

export type ApplicationStatus =
  | "applied"
  | "accepted"
  | "rejected"
  | "completed";

export type NotificationType =
  | "score_update"
  | "bookmark"
  | "match"
  | "internship"
  | "system";

export type PaymentType =
  | "subscription"
  | "success_fee"
  | "marketplace_commission";

export type PaymentStatus = "pending" | "completed" | "refunded";

export type InstitutionType =
  | "university"
  | "bootcamp"
  | "ngo"
  | "government";

// ---- Database Row Types ----

export interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  avatar_url: string | null;
  onboarding_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface Candidate {
  id: string;
  user_id: string;
  headline: string | null;
  resume_url: string | null;
  resume_parsed: ParsedResume | null;
  career_goals: string[];
  target_regions: string[];
  salary_min: number | null;
  salary_max: number | null;
  languages: LanguageEntry[];
  portfolio_links: string[];
  availability: CandidateAvailability;
  potential_score: number | null;
  score_updated_at: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface LanguageEntry {
  language: string;
  level: "basic" | "conversational" | "fluent" | "native";
}

export interface ParsedResume {
  summary: string;
  experience: ResumeExperience[];
  education: ResumeEducation[];
  skills: string[];
  certifications: string[];
}

export interface ResumeExperience {
  title: string;
  company: string;
  duration: string;
  description: string;
}

export interface ResumeEducation {
  degree: string;
  institution: string;
  year: string;
  field: string;
}

export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  demand_score: number;
}

export interface CandidateSkill {
  candidate_id: string;
  skill_id: string;
  proficiency: SkillProficiency;
  verified: boolean;
  source: SkillSource;
  skill?: Skill; // Joined
}

export interface Roadmap {
  id: string;
  candidate_id: string;
  target_role: string;
  phases: RoadmapPhase[];
  completion_pct: number;
  status: RoadmapStatus;
  generated_by_model: string;
  last_adapted_at: string | null;
  created_at: string;
}

export interface RoadmapPhase {
  title: string;
  duration_weeks: number;
  milestones: RoadmapMilestone[];
}

export interface RoadmapMilestone {
  title: string;
  description: string;
  skills: string[];
  resources: RoadmapResource[];
  assessment: MilestoneAssessment | null;
  completed: boolean;
  completed_at: string | null;
}

export interface RoadmapResource {
  type: "course" | "video" | "article" | "project" | "book";
  title: string;
  url: string;
  provider: string;
  free: boolean;
}

export interface MilestoneAssessment {
  type: "quiz" | "project_submission";
  criteria: string;
}

export interface Assessment {
  id: string;
  candidate_id: string;
  skill_id: string;
  type: AssessmentType;
  score: number;
  max_score: number;
  completed_at: string;
  proctored: boolean;
  skill?: Skill;
}

export interface PotentialScore {
  id: string;
  candidate_id: string;
  total_score: number;
  learning_velocity: number;
  skill_gap_closure: number;
  assessment_performance: number;
  project_consistency: number;
  credential_quality: number;
  roadmap_progress: number;
  simulation_performance: number;
  employer_feedback: number;
  computed_at: string;
  model_version: string;
}

export interface Credential {
  id: string;
  candidate_id: string;
  provider: CredentialProvider;
  title: string;
  credential_url: string;
  verified: boolean;
  verified_at: string | null;
  skill_ids: string[];
  created_at: string;
}

export interface Employer {
  id: string;
  user_id: string;
  company_name: string;
  company_size: CompanySize;
  industry: string;
  website: string | null;
  logo_url: string | null;
  plan: EmployerPlan;
  team_seats: number;
  candidate_views_remaining: number;
  created_at: string;
  updated_at: string;
}

export interface Institution {
  id: string;
  user_id: string;
  name: string;
  country: string;
  type: InstitutionType;
  student_count: number;
  verified: boolean;
  created_at: string;
}

export interface CohortMember {
  id: string;
  cohort_id: string;
  candidate_id: string;
  role: "student" | "mentor";
  joined_at: string;
}

export interface JobPost {
  id: string;
  employer_id: string;
  title: string;
  description: string;
  required_skills: string[];
  min_potential_score: number;
  region: string;
  salary_min: number | null;
  salary_max: number | null;
  type: JobType;
  blind_mode: boolean;
  status: JobStatus;
  created_at: string;
}

export interface Bookmark {
  id: string;
  employer_id: string;
  candidate_id: string;
  readiness_threshold: number;
  notified: boolean;
  notes: string | null;
  created_at: string;
}

export interface Internship {
  id: string;
  employer_id: string;
  title: string;
  description: string;
  category: InternshipCategory;
  duration_weeks: number;
  is_paid: boolean;
  compensation: number | null;
  is_remote: boolean;
  max_applicants: number;
  status: InternshipStatus;
  skills_required: string[];
  created_at: string;
}

export interface InternshipApplication {
  id: string;
  internship_id: string;
  candidate_id: string;
  status: ApplicationStatus;
  submission_url: string | null;
  employer_rating: number | null;
  candidate_rating: number | null;
  employer_review: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface University {
  id: string;
  user_id: string;
  name: string;
  country: string;
  type: InstitutionType;
  student_count: number;
}

export interface Cohort {
  id: string;
  university_id: string;
  name: string;
  candidate_ids: string[];
  graduation_date: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  action_url: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  employer_id: string;
  type: PaymentType;
  amount: number;
  currency: string;
  status: PaymentStatus;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ---- Composite/View Types ----

export interface CandidateProfile extends Candidate {
  user: User;
  skills: CandidateSkill[];
  score: PotentialScore | null;
}

export interface BlindCandidate {
  id: string;
  potential_score: number | null;
  score: PotentialScore | null;
  skills: CandidateSkill[];
  availability: CandidateAvailability;
  region: string; // Country only, not city
  languages: LanguageEntry[];
  roadmap_completion: number;
  credential_count: number;
}
