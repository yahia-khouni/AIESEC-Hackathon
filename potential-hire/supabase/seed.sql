-- ============================================================
-- PotentialHire Extended Seed Data (MVP Demonstration)
-- ============================================================

-- Ensure pgcrypto is enabled for password hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
DECLARE
    -- Run ID to prevent email collisions
    run_id TEXT := floor(extract(epoch from now()))::TEXT;

    -- User IDs
    c1 UUID := gen_random_uuid(); c2 UUID := gen_random_uuid(); c3 UUID := gen_random_uuid();
    c4 UUID := gen_random_uuid(); c5 UUID := gen_random_uuid(); c6 UUID := gen_random_uuid();
    c7 UUID := gen_random_uuid(); c8 UUID := gen_random_uuid(); c9 UUID := gen_random_uuid();
    c10 UUID := gen_random_uuid();
    e1 UUID := gen_random_uuid(); e2 UUID := gen_random_uuid(); e3 UUID := gen_random_uuid();
    inst1 UUID := gen_random_uuid();
    
    -- Profile IDs
    cp1 UUID := gen_random_uuid(); cp2 UUID := gen_random_uuid(); cp3 UUID := gen_random_uuid();
    cp4 UUID := gen_random_uuid(); cp5 UUID := gen_random_uuid(); cp6 UUID := gen_random_uuid();
    cp7 UUID := gen_random_uuid(); cp8 UUID := gen_random_uuid(); cp9 UUID := gen_random_uuid();
    cp10 UUID := gen_random_uuid();
    ep1 UUID := gen_random_uuid(); ep2 UUID := gen_random_uuid(); ep3 UUID := gen_random_uuid();
    
    -- Skill IDs (fetched dynamically later)
    s_react UUID; s_node UUID; s_python UUID; s_figma UUID; s_sql UUID;
    s_comm UUID; s_aws UUID; s_docker UUID; s_ts UUID; s_go UUID;
    s_marketing UUID; s_data UUID; s_ux UUID;
    
    -- Job & Internship IDs
    j1 UUID := gen_random_uuid(); j2 UUID := gen_random_uuid(); j3 UUID := gen_random_uuid();
    j4 UUID := gen_random_uuid(); j5 UUID := gen_random_uuid();
    int1 UUID := gen_random_uuid(); int2 UUID := gen_random_uuid(); int3 UUID := gen_random_uuid();
    int4 UUID := gen_random_uuid();
    
BEGIN
    -- ==========================================
    -- 1. AUTH USERS (auth.users)
    -- ==========================================
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, instance_id)
    VALUES 
    (c1, 'alex.' || run_id || '@example.com', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Alex Developer","role":"candidate"}', NOW(), NOW(), 'authenticated', '00000000-0000-0000-0000-000000000000'),
    (c2, 'sarah.' || run_id || '@example.com', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Sarah UI/UX","role":"candidate"}', NOW(), NOW(), 'authenticated', '00000000-0000-0000-0000-000000000000'),
    (c3, 'michael.' || run_id || '@example.com', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Michael Data","role":"candidate"}', NOW(), NOW(), 'authenticated', '00000000-0000-0000-0000-000000000000'),
    (c4, 'emily.' || run_id || '@example.com', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Emily DevOps","role":"candidate"}', NOW(), NOW(), 'authenticated', '00000000-0000-0000-0000-000000000000'),
    (c5, 'david.' || run_id || '@example.com', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"David Backend","role":"candidate"}', NOW(), NOW(), 'authenticated', '00000000-0000-0000-0000-000000000000'),
    (c6, 'jessica.' || run_id || '@example.com', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Jessica Marketing","role":"candidate"}', NOW(), NOW(), 'authenticated', '00000000-0000-0000-0000-000000000000'),
    (c7, 'ryan.' || run_id || '@example.com', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Ryan Frontend","role":"candidate"}', NOW(), NOW(), 'authenticated', '00000000-0000-0000-0000-000000000000'),
    (c8, 'olivia.' || run_id || '@example.com', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Olivia Analyst","role":"candidate"}', NOW(), NOW(), 'authenticated', '00000000-0000-0000-0000-000000000000'),
    (c9, 'daniel.' || run_id || '@example.com', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Daniel Systems","role":"candidate"}', NOW(), NOW(), 'authenticated', '00000000-0000-0000-0000-000000000000'),
    (c10, 'sophia.' || run_id || '@example.com', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Sophia PM","role":"candidate"}', NOW(), NOW(), 'authenticated', '00000000-0000-0000-0000-000000000000'),
    
    (e1, 'hiring.' || run_id || '@techcorp.com', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"TechCorp HR","role":"employer"}', NOW(), NOW(), 'authenticated', '00000000-0000-0000-0000-000000000000'),
    (e2, 'talent.' || run_id || '@innovatestudios.com', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Innovate Studios","role":"employer"}', NOW(), NOW(), 'authenticated', '00000000-0000-0000-0000-000000000000'),
    (e3, 'careers.' || run_id || '@dataflow.io', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"DataFlow Inc","role":"employer"}', NOW(), NOW(), 'authenticated', '00000000-0000-0000-0000-000000000000'),
    
    (inst1, 'admin.' || run_id || '@bootcamp.edu', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Bootcamp Admin","role":"institution"}', NOW(), NOW(), 'authenticated', '00000000-0000-0000-0000-000000000000');

    -- ==========================================
    -- 2. PUBLIC USERS (UPDATE, since Auth trigger inserts them)
    -- ==========================================
    UPDATE public.users SET onboarding_complete = true 
    WHERE id IN (c1, c2, c3, c4, c5, c6, c7, c8, c9, c10, e1, e2, e3, inst1);

    -- ==========================================
    -- 3. PROFILES
    -- ==========================================
    INSERT INTO public.candidates (id, user_id, headline, career_goals, target_regions, salary_min, salary_max, availability, potential_score, is_public)
    VALUES 
    (cp1, c1, 'Full Stack Web Developer', ARRAY['Senior Frontend Role', 'Tech Lead'], ARRAY['Remote', 'New York'], 70000, 120000, 'immediate', 85.5, true),
    (cp2, c2, 'Product Designer & UX Researcher', ARRAY['Lead Designer', 'UX Manager'], ARRAY['London', 'Remote'], 60000, 95000, '1_month', 92.0, true),
    (cp3, c3, 'Data Scientist / Machine Learning', ARRAY['Data Scientist', 'AI Engineer'], ARRAY['San Francisco', 'Remote'], 90000, 150000, 'immediate', 88.5, true),
    (cp4, c4, 'Cloud DevOps Engineer', ARRAY['DevOps Engineer', 'SRE'], ARRAY['Remote'], 80000, 130000, '3_months', 78.0, true),
    (cp5, c5, 'Backend Developer (Go/Node)', ARRAY['Backend Engineer'], ARRAY['Berlin', 'Remote'], 65000, 100000, 'immediate', 82.5, true),
    (cp6, c6, 'Digital Marketing Specialist', ARRAY['Marketing Manager', 'Growth Lead'], ARRAY['Remote'], 50000, 80000, 'immediate', 75.0, true),
    (cp7, c7, 'Junior Frontend Developer', ARRAY['Frontend Developer'], ARRAY['New York', 'Remote'], 50000, 75000, 'immediate', 65.0, true),
    (cp8, c8, 'Business Data Analyst', ARRAY['Data Analyst'], ARRAY['London', 'Berlin'], 55000, 85000, '1_month', 81.0, true),
    (cp9, c9, 'Systems Architect', ARRAY['Software Architect'], ARRAY['San Francisco', 'Remote'], 120000, 180000, '6_months', 95.5, true),
    (cp10, c10, 'Technical Product Manager', ARRAY['Product Manager', 'Director of Product'], ARRAY['Remote'], 95000, 140000, 'immediate', 89.0, true);

    INSERT INTO public.employers (id, user_id, company_name, company_size, industry, website, plan)
    VALUES 
    (ep1, e1, 'TechCorp Innovators', 'enterprise', 'Software Development', 'https://techcorp.example.com', 'enterprise'),
    (ep2, e2, 'Innovate Studios', 'startup', 'Design Agency', 'https://innovatestudios.com', 'startup'),
    (ep3, e3, 'DataFlow Analytics', 'sme', 'Data Science', 'https://dataflow.io', 'growth');

    INSERT INTO public.universities (user_id, name, country, type, student_count)
    VALUES 
    (inst1, 'Global Tech Bootcamp', 'USA', 'bootcamp', 500);

    -- ==========================================
    -- 4. SKILLS
    -- ==========================================
    INSERT INTO public.skills (name, category, demand_score) VALUES
    ('React.js', 'technical', 95.0),
    ('Node.js', 'technical', 90.0),
    ('Python', 'technical', 88.0),
    ('Figma', 'technical', 92.0),
    ('PostgreSQL', 'technical', 85.0),
    ('Communication', 'soft', 98.0),
    ('AWS', 'technical', 94.0),
    ('Docker', 'technical', 91.0),
    ('TypeScript', 'technical', 96.0),
    ('Go', 'technical', 84.0),
    ('Digital Marketing', 'domain', 82.0),
    ('Data Analysis', 'technical', 89.0),
    ('UX Research', 'domain', 87.0)
    ON CONFLICT (name) DO UPDATE SET demand_score = EXCLUDED.demand_score;

    SELECT id INTO s_react FROM public.skills WHERE name = 'React.js';
    SELECT id INTO s_node FROM public.skills WHERE name = 'Node.js';
    SELECT id INTO s_python FROM public.skills WHERE name = 'Python';
    SELECT id INTO s_figma FROM public.skills WHERE name = 'Figma';
    SELECT id INTO s_sql FROM public.skills WHERE name = 'PostgreSQL';
    SELECT id INTO s_comm FROM public.skills WHERE name = 'Communication';
    SELECT id INTO s_aws FROM public.skills WHERE name = 'AWS';
    SELECT id INTO s_docker FROM public.skills WHERE name = 'Docker';
    SELECT id INTO s_ts FROM public.skills WHERE name = 'TypeScript';
    SELECT id INTO s_go FROM public.skills WHERE name = 'Go';
    SELECT id INTO s_marketing FROM public.skills WHERE name = 'Digital Marketing';
    SELECT id INTO s_data FROM public.skills WHERE name = 'Data Analysis';
    SELECT id INTO s_ux FROM public.skills WHERE name = 'UX Research';

    -- ==========================================
    -- 5. CANDIDATE SKILLS
    -- ==========================================
    INSERT INTO public.candidate_skills (candidate_id, skill_id, proficiency, verified, source) VALUES
    (cp1, s_react, 'advanced', true, 'assessment'),
    (cp1, s_node, 'intermediate', true, 'credential'),
    (cp1, s_sql, 'intermediate', false, 'self_reported'),
    (cp1, s_ts, 'advanced', true, 'ai_extracted'),
    
    (cp2, s_figma, 'expert', true, 'assessment'),
    (cp2, s_ux, 'advanced', true, 'credential'),
    (cp2, s_comm, 'expert', true, 'ai_extracted'),
    
    (cp3, s_python, 'expert', true, 'credential'),
    (cp3, s_data, 'advanced', true, 'assessment'),
    (cp3, s_sql, 'advanced', false, 'self_reported'),
    
    (cp4, s_aws, 'advanced', true, 'assessment'),
    (cp4, s_docker, 'expert', true, 'credential'),
    (cp4, s_python, 'intermediate', false, 'self_reported'),

    (cp5, s_go, 'advanced', true, 'ai_extracted'),
    (cp5, s_node, 'expert', true, 'assessment'),
    (cp5, s_docker, 'intermediate', false, 'self_reported'),

    (cp6, s_marketing, 'expert', true, 'assessment'),
    (cp6, s_comm, 'advanced', true, 'self_reported'),

    (cp7, s_react, 'beginner', false, 'self_reported'),
    (cp7, s_ts, 'beginner', false, 'self_reported'),

    (cp8, s_data, 'advanced', true, 'credential'),
    (cp8, s_sql, 'expert', true, 'assessment'),

    (cp9, s_aws, 'expert', true, 'credential'),
    (cp9, s_go, 'expert', true, 'ai_extracted'),
    (cp9, s_node, 'expert', true, 'self_reported'),

    (cp10, s_comm, 'expert', true, 'assessment'),
    (cp10, s_ux, 'intermediate', false, 'self_reported');

    -- ==========================================
    -- 6. ASSESSMENTS
    -- ==========================================
    INSERT INTO public.assessments (candidate_id, skill_id, type, score, max_score, proctored) VALUES
    (cp1, s_react, 'quiz', 92, 100, true),
    (cp1, s_node, 'project', 85, 100, false),
    (cp2, s_figma, 'quiz', 98, 100, true),
    (cp3, s_python, 'quiz', 95, 100, true),
    (cp4, s_aws, 'simulation', 88, 100, true),
    (cp5, s_go, 'project', 90, 100, false),
    (cp8, s_sql, 'quiz', 97, 100, true);

    -- ==========================================
    -- 7. CREDENTIALS
    -- ==========================================
    INSERT INTO public.credentials (candidate_id, provider, title, credential_url, verified, verified_at, skill_ids) VALUES
    (cp1, 'udemy', 'Advanced Node.js Bootcamp', 'https://udemy.com/cert/123', true, NOW(), ARRAY[s_node]),
    (cp2, 'coursera', 'Google UX Design Professional Certificate', 'https://coursera.org/cert/456', true, NOW(), ARRAY[s_ux, s_figma]),
    (cp3, 'university', 'MSc Data Science', 'https://stanford.edu/cert/789', true, NOW(), ARRAY[s_python, s_data]),
    (cp4, 'other', 'AWS Certified Solutions Architect', 'https://aws.amazon.com/cert/abc', true, NOW(), ARRAY[s_aws]),
    (cp8, 'coursera', 'IBM Data Analyst', 'https://coursera.org/cert/def', true, NOW(), ARRAY[s_data, s_sql]);

    -- ==========================================
    -- 8. POTENTIAL SCORES HISTORY
    -- ==========================================
    INSERT INTO public.potential_scores (candidate_id, total_score, learning_velocity, skill_gap_closure, assessment_performance, project_consistency) VALUES
    (cp1, 85.5, 90.0, 80.0, 88.5, 85.0),
    (cp2, 92.0, 95.0, 90.0, 98.0, 88.0),
    (cp3, 88.5, 85.0, 92.0, 95.0, 80.0),
    (cp4, 78.0, 75.0, 80.0, 88.0, 70.0),
    (cp5, 82.5, 88.0, 85.0, 90.0, 80.0),
    (cp6, 75.0, 70.0, 75.0, 80.0, 75.0),
    (cp7, 65.0, 80.0, 60.0, 50.0, 60.0),
    (cp8, 81.0, 82.0, 85.0, 97.0, 75.0),
    (cp9, 95.5, 98.0, 95.0, 95.0, 92.0),
    (cp10, 89.0, 90.0, 88.0, 90.0, 85.0);

    -- ==========================================
    -- 9. JOB POSTS & INTERNSHIPS
    -- ==========================================
    INSERT INTO public.job_posts (id, employer_id, title, description, min_potential_score, type, status, salary_min, salary_max, required_skills)
    VALUES 
    (j1, ep1, 'Senior React Developer', 'Looking for an experienced React developer to lead our frontend team.', 80.0, 'full_time', 'active', 90000, 130000, ARRAY[s_react, s_ts]),
    (j2, ep1, 'Backend Engineer (Node/Postgres)', 'Scale our APIs and optimize our database queries.', 75.0, 'full_time', 'active', 80000, 120000, ARRAY[s_node, s_sql]),
    (j3, ep3, 'Data Scientist', 'Build predictive models and analyze large datasets.', 85.0, 'full_time', 'active', 100000, 150000, ARRAY[s_python, s_data]),
    (j4, ep2, 'Lead UI/UX Designer', 'Lead the design of our next-gen mobile application.', 80.0, 'full_time', 'active', 85000, 120000, ARRAY[s_figma, s_ux]),
    (j5, ep1, 'DevOps Engineer', 'Maintain our AWS infrastructure and Docker deployments.', 75.0, 'contract', 'active', 70000, 110000, ARRAY[s_aws, s_docker]);

    INSERT INTO public.internships (id, employer_id, title, description, category, duration_weeks, is_paid, compensation, status, skills_required)
    VALUES 
    (int1, ep2, 'UX Design Intern', 'Join our design team for a 12-week summer internship. Learn Figma advanced techniques and user research.', 'ui_design', 12, true, 2000, 'open', ARRAY[s_figma]),
    (int2, ep1, 'Frontend Development Intern', 'Work on our core React application alongside senior engineers.', 'dev', 8, true, 1500, 'open', ARRAY[s_react]),
    (int3, ep3, 'Data Analytics Intern', 'Clean data and build dashboards using Python.', 'data_analysis', 10, true, 1800, 'open', ARRAY[s_python]),
    (int4, ep1, 'Digital Marketing Micro-internship', 'Help run our social media campaigns for a specific product launch.', 'marketing', 4, false, 0, 'open', ARRAY[s_marketing]);

    -- ==========================================
    -- 10. APPLICATIONS
    -- ==========================================
    INSERT INTO public.internship_applications (internship_id, candidate_id, status, employer_rating, candidate_rating)
    VALUES 
    (int1, cp2, 'applied', null, null),
    (int1, cp10, 'rejected', null, null),
    (int2, cp7, 'applied', null, null),
    (int2, cp1, 'accepted', null, null),
    (int3, cp8, 'completed', 4.5, 5.0),
    (int4, cp6, 'applied', null, null);

    -- ==========================================
    -- 11. BOOKMARKS
    -- ==========================================
    INSERT INTO public.bookmarks (employer_id, candidate_id, readiness_threshold, notified)
    VALUES 
    (ep1, cp1, 85.0, true),
    (ep1, cp5, 80.0, false),
    (ep3, cp3, 85.0, true),
    (ep2, cp2, 90.0, true);

    -- ==========================================
    -- 12. ROADMAPS
    -- ==========================================
    INSERT INTO public.roadmaps (candidate_id, target_role, completion_pct, status, phases)
    VALUES 
    (cp1, 'Full Stack Engineer', 25.0, 'active', '[
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
    ]'),
    (cp7, 'Mid-Level Frontend Developer', 10.0, 'active', '[
        {
            "title": "React Foundation",
            "duration_weeks": 4,
            "milestones": [
                {"title": "State Management", "completed": true, "completed_at": "2023-10-05T10:00:00Z"},
                {"title": "Component Lifecycle", "completed": false}
            ]
        }
    ]'),
    (cp8, 'Data Scientist', 0.0, 'active', '[
        {
            "title": "Python Data Manipulation",
            "duration_weeks": 3,
            "milestones": [
                {"title": "Pandas & NumPy", "completed": false},
                {"title": "Data Cleaning", "completed": false}
            ]
        }
    ]');

END $$;
