-- ============================================================
-- PotentialHire — Full Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('candidate', 'employer', 'institution', 'admin');
CREATE TYPE candidate_availability AS ENUM ('immediate', '1_month', '3_months', '6_months');
CREATE TYPE skill_proficiency AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');
CREATE TYPE skill_source AS ENUM ('self_reported', 'ai_extracted', 'assessment', 'credential');
CREATE TYPE skill_category AS ENUM ('technical', 'soft', 'domain');
CREATE TYPE roadmap_status AS ENUM ('active', 'completed', 'paused');
CREATE TYPE assessment_type AS ENUM ('quiz', 'project', 'simulation', 'peer_review');
CREATE TYPE credential_provider AS ENUM ('coursera', 'udemy', 'freecodecamp', 'university', 'internal', 'other');
CREATE TYPE job_type AS ENUM ('full_time', 'part_time', 'contract', 'internship');
CREATE TYPE job_status AS ENUM ('draft', 'active', 'closed');
CREATE TYPE company_size AS ENUM ('startup', 'sme', 'enterprise');
CREATE TYPE employer_plan AS ENUM ('free', 'startup', 'growth', 'enterprise');
CREATE TYPE internship_status AS ENUM ('open', 'in_progress', 'completed', 'cancelled');
CREATE TYPE internship_category AS ENUM ('data_analysis', 'ui_design', 'content', 'dev', 'research', 'marketing', 'other');
CREATE TYPE application_status AS ENUM ('applied', 'accepted', 'rejected', 'completed');
CREATE TYPE notification_type AS ENUM ('score_update', 'bookmark', 'match', 'internship', 'system');
CREATE TYPE payment_type AS ENUM ('subscription', 'success_fee', 'marketplace_commission');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'refunded');
CREATE TYPE institution_type AS ENUM ('university', 'bootcamp', 'ngo', 'government');

-- ============================================================
-- TABLES
-- ============================================================

-- Users (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'candidate',
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Candidates
CREATE TABLE public.candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  headline TEXT,
  resume_url TEXT,
  resume_parsed JSONB,
  career_goals TEXT[] DEFAULT '{}',
  target_regions TEXT[] DEFAULT '{}',
  salary_min INTEGER,
  salary_max INTEGER,
  languages JSONB DEFAULT '[]',
  portfolio_links TEXT[] DEFAULT '{}',
  availability candidate_availability DEFAULT 'immediate',
  potential_score NUMERIC(5,2),
  score_updated_at TIMESTAMPTZ,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Employers
CREATE TABLE public.employers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  company_size company_size DEFAULT 'startup',
  industry TEXT,
  website TEXT,
  logo_url TEXT,
  plan employer_plan NOT NULL DEFAULT 'free',
  team_seats INTEGER NOT NULL DEFAULT 1,
  candidate_views_remaining INTEGER NOT NULL DEFAULT 20,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Skills (master list)
CREATE TABLE public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  category skill_category NOT NULL DEFAULT 'technical',
  demand_score NUMERIC(5,2) DEFAULT 50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Candidate Skills (junction)
CREATE TABLE public.candidate_skills (
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  proficiency skill_proficiency NOT NULL DEFAULT 'beginner',
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  source skill_source NOT NULL DEFAULT 'self_reported',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (candidate_id, skill_id)
);

-- Roadmaps
CREATE TABLE public.roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  target_role TEXT NOT NULL,
  phases JSONB NOT NULL DEFAULT '[]',
  completion_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  status roadmap_status NOT NULL DEFAULT 'active',
  generated_by_model TEXT,
  last_adapted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Assessments
CREATE TABLE public.assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  type assessment_type NOT NULL DEFAULT 'quiz',
  score NUMERIC(5,2) NOT NULL DEFAULT 0,
  max_score NUMERIC(5,2) NOT NULL DEFAULT 100,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  proctored BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Potential Scores (history)
CREATE TABLE public.potential_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  total_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  learning_velocity NUMERIC(5,2) NOT NULL DEFAULT 0,
  skill_gap_closure NUMERIC(5,2) NOT NULL DEFAULT 0,
  assessment_performance NUMERIC(5,2) NOT NULL DEFAULT 0,
  project_consistency NUMERIC(5,2) NOT NULL DEFAULT 0,
  credential_quality NUMERIC(5,2) NOT NULL DEFAULT 0,
  roadmap_progress NUMERIC(5,2) NOT NULL DEFAULT 0,
  simulation_performance NUMERIC(5,2) NOT NULL DEFAULT 0,
  employer_feedback NUMERIC(5,2) NOT NULL DEFAULT 0,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  model_version TEXT NOT NULL DEFAULT 'v1.0'
);

-- Credentials
CREATE TABLE public.credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  provider credential_provider NOT NULL,
  title TEXT NOT NULL,
  credential_url TEXT NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  skill_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Job Posts
CREATE TABLE public.job_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES public.employers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  required_skills UUID[] DEFAULT '{}',
  min_potential_score NUMERIC(5,2) DEFAULT 0,
  region TEXT,
  salary_min INTEGER,
  salary_max INTEGER,
  type job_type NOT NULL DEFAULT 'full_time',
  blind_mode BOOLEAN NOT NULL DEFAULT TRUE,
  status job_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bookmarks
CREATE TABLE public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES public.employers(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  readiness_threshold NUMERIC(5,2) DEFAULT 80,
  notified BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(employer_id, candidate_id)
);

-- Internships (Marketplace)
CREATE TABLE public.internships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES public.employers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category internship_category NOT NULL DEFAULT 'other',
  duration_weeks INTEGER NOT NULL DEFAULT 2,
  is_paid BOOLEAN NOT NULL DEFAULT FALSE,
  compensation INTEGER,
  is_remote BOOLEAN NOT NULL DEFAULT TRUE,
  max_applicants INTEGER NOT NULL DEFAULT 5,
  status internship_status NOT NULL DEFAULT 'open',
  skills_required UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Internship Applications
CREATE TABLE public.internship_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  internship_id UUID NOT NULL REFERENCES public.internships(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  status application_status NOT NULL DEFAULT 'applied',
  submission_url TEXT,
  employer_rating NUMERIC(3,1),
  candidate_rating NUMERIC(3,1),
  employer_review TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(internship_id, candidate_id)
);

-- Universities / Institutions
CREATE TABLE public.universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  type institution_type NOT NULL DEFAULT 'university',
  student_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cohorts
CREATE TABLE public.cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  candidate_ids UUID[] DEFAULT '{}',
  graduation_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type notification_type NOT NULL DEFAULT 'system',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Payments (future-ready)
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES public.employers(id) ON DELETE CASCADE,
  type payment_type NOT NULL,
  amount INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  status payment_status NOT NULL DEFAULT 'pending',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_candidates_user_id ON public.candidates(user_id);
CREATE INDEX idx_candidates_potential_score ON public.candidates(potential_score DESC);
CREATE INDEX idx_candidates_is_public ON public.candidates(is_public) WHERE is_public = TRUE;
CREATE INDEX idx_employers_user_id ON public.employers(user_id);
CREATE INDEX idx_skills_name ON public.skills USING gin(name gin_trgm_ops);
CREATE INDEX idx_skills_category ON public.skills(category);
CREATE INDEX idx_candidate_skills_candidate ON public.candidate_skills(candidate_id);
CREATE INDEX idx_candidate_skills_skill ON public.candidate_skills(skill_id);
CREATE INDEX idx_roadmaps_candidate ON public.roadmaps(candidate_id);
CREATE INDEX idx_roadmaps_status ON public.roadmaps(status) WHERE status = 'active';
CREATE INDEX idx_assessments_candidate ON public.assessments(candidate_id);
CREATE INDEX idx_potential_scores_candidate ON public.potential_scores(candidate_id);
CREATE INDEX idx_credentials_candidate ON public.credentials(candidate_id);
CREATE INDEX idx_job_posts_employer ON public.job_posts(employer_id);
CREATE INDEX idx_job_posts_status ON public.job_posts(status) WHERE status = 'active';
CREATE INDEX idx_bookmarks_employer ON public.bookmarks(employer_id);
CREATE INDEX idx_internships_status ON public.internships(status) WHERE status = 'open';
CREATE INDEX idx_internship_apps_internship ON public.internship_applications(internship_id);
CREATE INDEX idx_internship_apps_candidate ON public.internship_applications(candidate_id);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id) WHERE read = FALSE;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.potential_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internship_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Users: own data
CREATE POLICY "users_own_data" ON public.users
  FOR ALL USING (id = auth.uid());

-- Candidates: own data
CREATE POLICY "candidates_own_data" ON public.candidates
  FOR ALL USING (user_id = auth.uid());

-- Candidates: public profiles viewable by employers
CREATE POLICY "candidates_public_read" ON public.candidates
  FOR SELECT USING (is_public = TRUE);

-- Employers: own data
CREATE POLICY "employers_own_data" ON public.employers
  FOR ALL USING (user_id = auth.uid());

-- Skills: readable by all authenticated
CREATE POLICY "skills_read_all" ON public.skills
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Skills: insertable by authenticated (for new skills)
CREATE POLICY "skills_insert" ON public.skills
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Candidate Skills: own data
CREATE POLICY "candidate_skills_own" ON public.candidate_skills
  FOR ALL USING (
    candidate_id IN (SELECT id FROM public.candidates WHERE user_id = auth.uid())
  );

-- Candidate Skills: readable by employers for public candidates
CREATE POLICY "candidate_skills_public_read" ON public.candidate_skills
  FOR SELECT USING (
    candidate_id IN (SELECT id FROM public.candidates WHERE is_public = TRUE)
  );

-- Roadmaps: own data
CREATE POLICY "roadmaps_own" ON public.roadmaps
  FOR ALL USING (
    candidate_id IN (SELECT id FROM public.candidates WHERE user_id = auth.uid())
  );

-- Assessments: own data
CREATE POLICY "assessments_own" ON public.assessments
  FOR ALL USING (
    candidate_id IN (SELECT id FROM public.candidates WHERE user_id = auth.uid())
  );

-- Potential Scores: own data
CREATE POLICY "scores_own" ON public.potential_scores
  FOR ALL USING (
    candidate_id IN (SELECT id FROM public.candidates WHERE user_id = auth.uid())
  );

-- Potential Scores: readable by employers for public candidates
CREATE POLICY "scores_public_read" ON public.potential_scores
  FOR SELECT USING (
    candidate_id IN (SELECT id FROM public.candidates WHERE is_public = TRUE)
  );

-- Credentials: own data
CREATE POLICY "credentials_own" ON public.credentials
  FOR ALL USING (
    candidate_id IN (SELECT id FROM public.candidates WHERE user_id = auth.uid())
  );

-- Credentials: readable by employers for public candidates
CREATE POLICY "credentials_public_read" ON public.credentials
  FOR SELECT USING (
    candidate_id IN (SELECT id FROM public.candidates WHERE is_public = TRUE)
  );

-- Job Posts: employer owns
CREATE POLICY "job_posts_own" ON public.job_posts
  FOR ALL USING (
    employer_id IN (SELECT id FROM public.employers WHERE user_id = auth.uid())
  );

-- Job Posts: active posts readable by candidates
CREATE POLICY "job_posts_active_read" ON public.job_posts
  FOR SELECT USING (status = 'active');

-- Bookmarks: employer owns
CREATE POLICY "bookmarks_own" ON public.bookmarks
  FOR ALL USING (
    employer_id IN (SELECT id FROM public.employers WHERE user_id = auth.uid())
  );

-- Internships: employer owns
CREATE POLICY "internships_own" ON public.internships
  FOR ALL USING (
    employer_id IN (SELECT id FROM public.employers WHERE user_id = auth.uid())
  );

-- Internships: open ones readable by all
CREATE POLICY "internships_open_read" ON public.internships
  FOR SELECT USING (status = 'open');

-- Internship Applications: own data (candidate or employer)
CREATE POLICY "internship_apps_candidate" ON public.internship_applications
  FOR ALL USING (
    candidate_id IN (SELECT id FROM public.candidates WHERE user_id = auth.uid())
  );

CREATE POLICY "internship_apps_employer" ON public.internship_applications
  FOR SELECT USING (
    internship_id IN (
      SELECT id FROM public.internships WHERE employer_id IN (
        SELECT id FROM public.employers WHERE user_id = auth.uid()
      )
    )
  );

-- Notifications: own data
CREATE POLICY "notifications_own" ON public.notifications
  FOR ALL USING (user_id = auth.uid());

-- Universities: own data
CREATE POLICY "universities_own" ON public.universities
  FOR ALL USING (user_id = auth.uid());

-- Cohorts: university owns
CREATE POLICY "cohorts_own" ON public.cohorts
  FOR ALL USING (
    university_id IN (SELECT id FROM public.universities WHERE user_id = auth.uid())
  );

-- Payments: employer owns
CREATE POLICY "payments_own" ON public.payments
  FOR ALL USING (
    employer_id IN (SELECT id FROM public.employers WHERE user_id = auth.uid())
  );

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER candidates_updated_at BEFORE UPDATE ON public.candidates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER employers_updated_at BEFORE UPDATE ON public.employers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER roadmaps_updated_at BEFORE UPDATE ON public.roadmaps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER job_posts_updated_at BEFORE UPDATE ON public.job_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER internships_updated_at BEFORE UPDATE ON public.internships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create user profile after auth signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'candidate')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- SEED: Common Skills
-- ============================================================

INSERT INTO public.skills (name, category, demand_score) VALUES
  -- Technical
  ('JavaScript', 'technical', 95),
  ('TypeScript', 'technical', 92),
  ('Python', 'technical', 94),
  ('React', 'technical', 93),
  ('Next.js', 'technical', 88),
  ('Node.js', 'technical', 90),
  ('HTML', 'technical', 85),
  ('CSS', 'technical', 85),
  ('Tailwind CSS', 'technical', 82),
  ('SQL', 'technical', 88),
  ('PostgreSQL', 'technical', 85),
  ('MongoDB', 'technical', 78),
  ('Git', 'technical', 90),
  ('Docker', 'technical', 80),
  ('AWS', 'technical', 82),
  ('REST APIs', 'technical', 88),
  ('GraphQL', 'technical', 72),
  ('Java', 'technical', 82),
  ('C++', 'technical', 70),
  ('C#', 'technical', 75),
  ('Go', 'technical', 74),
  ('Rust', 'technical', 68),
  ('Swift', 'technical', 65),
  ('Kotlin', 'technical', 67),
  ('Flutter', 'technical', 70),
  ('React Native', 'technical', 73),
  ('Vue.js', 'technical', 76),
  ('Angular', 'technical', 72),
  ('Django', 'technical', 70),
  ('FastAPI', 'technical', 72),
  ('Express.js', 'technical', 78),
  ('Machine Learning', 'technical', 85),
  ('Data Analysis', 'technical', 88),
  ('TensorFlow', 'technical', 72),
  ('PyTorch', 'technical', 75),
  ('Figma', 'technical', 80),
  ('UI/UX Design', 'technical', 82),
  ('Cybersecurity', 'technical', 78),
  ('DevOps', 'technical', 80),
  ('CI/CD', 'technical', 78),
  -- Soft Skills
  ('Communication', 'soft', 95),
  ('Teamwork', 'soft', 92),
  ('Problem Solving', 'soft', 94),
  ('Critical Thinking', 'soft', 90),
  ('Leadership', 'soft', 85),
  ('Time Management', 'soft', 88),
  ('Adaptability', 'soft', 87),
  ('Creativity', 'soft', 82),
  ('Attention to Detail', 'soft', 85),
  ('Public Speaking', 'soft', 72),
  -- Domain
  ('Digital Marketing', 'domain', 85),
  ('SEO', 'domain', 78),
  ('Content Writing', 'domain', 75),
  ('Financial Analysis', 'domain', 80),
  ('Project Management', 'domain', 88),
  ('Agile/Scrum', 'domain', 82),
  ('Product Management', 'domain', 85),
  ('Business Analysis', 'domain', 80),
  ('Market Research', 'domain', 75),
  ('Supply Chain', 'domain', 68)
ON CONFLICT (name) DO NOTHING;
