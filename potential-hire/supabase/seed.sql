-- ============================================================
-- PotentialHire Seed Data (MVP Demonstration)
-- ============================================================

-- Ensure pgcrypto is enabled for password hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
DECLARE
    candidate_1_id UUID := gen_random_uuid();
    candidate_2_id UUID := gen_random_uuid();
    employer_1_id UUID := gen_random_uuid();
    institution_1_id UUID := gen_random_uuid();
    
    skill_react UUID := gen_random_uuid();
    skill_node UUID := gen_random_uuid();
    skill_python UUID := gen_random_uuid();
    skill_figma UUID := gen_random_uuid();
    skill_communication UUID := gen_random_uuid();
    skill_sql UUID := gen_random_uuid();
    
    candidate_1_profile_id UUID := gen_random_uuid();
    candidate_2_profile_id UUID := gen_random_uuid();
    employer_1_profile_id UUID := gen_random_uuid();
    
    job_1_id UUID := gen_random_uuid();
    internship_1_id UUID := gen_random_uuid();
    run_id TEXT := floor(extract(epoch from now()))::TEXT;
    email_cand1 TEXT := 'alex.' || run_id || '@example.com';
    email_cand2 TEXT := 'sarah.' || run_id || '@example.com';
    email_emp1 TEXT := 'hiring.' || run_id || '@techcorp.com';
    email_inst1 TEXT := 'admin.' || run_id || '@bootcamp.edu';
BEGIN
    -- ==========================================
    -- 1. AUTH USERS (auth.users)
    -- ==========================================
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, instance_id)
    VALUES 
    (candidate_1_id, email_cand1, crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Alex Developer","role":"candidate"}', NOW(), NOW(), 'authenticated', '00000000-0000-0000-0000-000000000000'),
    (candidate_2_id, email_cand2, crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Sarah UI/UX","role":"candidate"}', NOW(), NOW(), 'authenticated', '00000000-0000-0000-0000-000000000000'),
    (employer_1_id, email_emp1, crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"TechCorp HR","role":"employer"}', NOW(), NOW(), 'authenticated', '00000000-0000-0000-0000-000000000000'),
    (institution_1_id, email_inst1, crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Bootcamp Admin","role":"institution"}', NOW(), NOW(), 'authenticated', '00000000-0000-0000-0000-000000000000');

    -- ==========================================
    -- 2. PUBLIC USERS (UPDATE, since Auth trigger inserts them)
    -- ==========================================
    UPDATE public.users SET onboarding_complete = true 
    WHERE id IN (candidate_1_id, candidate_2_id, employer_1_id, institution_1_id);

    -- ==========================================
    -- 3. PROFILES
    -- ==========================================
    INSERT INTO public.candidates (id, user_id, headline, career_goals, target_regions, salary_min, salary_max, availability, potential_score, is_public)
    VALUES 
    (candidate_1_profile_id, candidate_1_id, 'Full Stack Web Developer', ARRAY['Senior Frontend Role', 'Tech Lead'], ARRAY['Remote', 'New York'], 70000, 120000, 'immediate', 85.5, true),
    (candidate_2_profile_id, candidate_2_id, 'Product Designer & UX Researcher', ARRAY['Lead Designer', 'UX Manager'], ARRAY['London', 'Remote'], 60000, 95000, '1_month', 92.0, true);

    INSERT INTO public.employers (id, user_id, company_name, company_size, industry, website, plan)
    VALUES 
    (employer_1_profile_id, employer_1_id, 'TechCorp Innovators', 'startup', 'Software Development', 'https://techcorp.example.com', 'startup');

    INSERT INTO public.universities (user_id, name, country, type, student_count)
    VALUES 
    (institution_1_id, 'Global Tech Bootcamp', 'USA', 'bootcamp', 500);

    -- ==========================================
    -- 4. SKILLS
    -- ==========================================
    INSERT INTO public.skills (name, category, demand_score) VALUES
    ('React.js', 'technical', 95.0),
    ('Node.js', 'technical', 90.0),
    ('Python', 'technical', 88.0),
    ('Figma', 'technical', 92.0),
    ('PostgreSQL', 'technical', 85.0),
    ('Communication', 'soft', 98.0)
    ON CONFLICT (name) DO UPDATE SET demand_score = EXCLUDED.demand_score;

    SELECT id INTO skill_react FROM public.skills WHERE name = 'React.js';
    SELECT id INTO skill_node FROM public.skills WHERE name = 'Node.js';
    SELECT id INTO skill_python FROM public.skills WHERE name = 'Python';
    SELECT id INTO skill_figma FROM public.skills WHERE name = 'Figma';
    SELECT id INTO skill_sql FROM public.skills WHERE name = 'PostgreSQL';
    SELECT id INTO skill_communication FROM public.skills WHERE name = 'Communication';

    -- ==========================================
    -- 5. CANDIDATE SKILLS
    -- ==========================================
    INSERT INTO public.candidate_skills (candidate_id, skill_id, proficiency, verified, source) VALUES
    (candidate_1_profile_id, skill_react, 'advanced', true, 'assessment'),
    (candidate_1_profile_id, skill_node, 'intermediate', true, 'credential'),
    (candidate_1_profile_id, skill_sql, 'intermediate', false, 'self_reported'),
    (candidate_1_profile_id, skill_communication, 'advanced', true, 'peer_review'),
    
    (candidate_2_profile_id, skill_figma, 'expert', true, 'assessment'),
    (candidate_2_profile_id, skill_communication, 'expert', true, 'peer_review');

    -- ==========================================
    -- 6. ASSESSMENTS
    -- ==========================================
    INSERT INTO public.assessments (candidate_id, skill_id, type, score, max_score, proctored) VALUES
    (candidate_1_profile_id, skill_react, 'quiz', 92, 100, true),
    (candidate_1_profile_id, skill_node, 'project', 85, 100, false),
    (candidate_2_profile_id, skill_figma, 'quiz', 98, 100, true);

    -- ==========================================
    -- 7. POTENTIAL SCORES HISTORY
    -- ==========================================
    INSERT INTO public.potential_scores (candidate_id, total_score, learning_velocity, skill_gap_closure, assessment_performance, project_consistency) VALUES
    (candidate_1_profile_id, 85.5, 90.0, 80.0, 88.5, 85.0),
    (candidate_2_profile_id, 92.0, 95.0, 90.0, 98.0, 88.0);

    -- ==========================================
    -- 8. JOB POSTS & INTERNSHIPS
    -- ==========================================
    INSERT INTO public.job_posts (id, employer_id, title, description, min_potential_score, type, status, salary_min, salary_max)
    VALUES 
    (job_1_id, employer_1_profile_id, 'Senior React Developer', 'Looking for an experienced React developer to lead our frontend team. Must have strong potential and fast learning velocity.', 80.0, 'full_time', 'active', 90000, 130000);

    INSERT INTO public.internships (id, employer_id, title, description, category, duration_weeks, is_paid, compensation, status)
    VALUES 
    (internship_1_id, employer_1_profile_id, 'UX Design Intern', 'Join our design team for a 12-week summer internship. Learn Figma advanced techniques and user research.', 'ui_design', 12, true, 2000, 'open');

    -- ==========================================
    -- 9. APPLICATIONS
    -- ==========================================
    INSERT INTO public.internship_applications (internship_id, candidate_id, status)
    VALUES 
    (internship_1_id, candidate_2_profile_id, 'applied');

    -- ==========================================
    -- 10. BOOKMARKS
    -- ==========================================
    INSERT INTO public.bookmarks (employer_id, candidate_id, readiness_threshold, notified)
    VALUES 
    (employer_1_profile_id, candidate_1_profile_id, 85.0, true);

    -- ==========================================
    -- 11. ROADMAPS
    -- ==========================================
    INSERT INTO public.roadmaps (candidate_id, target_role, completion_pct, status, phases)
    VALUES 
    (candidate_1_profile_id, 'Full Stack Engineer', 25.0, 'active', '[
        {
            "title": "Advanced React Patterns",
            "duration_weeks": 4,
            "milestones": [
                {"title": "Custom Hooks", "completed": true, "completed_at": "2023-10-01T10:00:00Z"},
                {"title": "Performance Optimization", "completed": false}
            ]
        },
        {
            "title": "Backend Mastery with Node.js",
            "duration_weeks": 6,
            "milestones": [
                {"title": "Express Middleware", "completed": false},
                {"title": "Database Design", "completed": false}
            ]
        }
    ]');

END $$;
