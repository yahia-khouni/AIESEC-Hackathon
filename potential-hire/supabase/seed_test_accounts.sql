-- ============================================================
-- PotentialHire Fixed Test Accounts
-- (Use these accounts to easily log in and test the MVP)
-- Password for all accounts: password123
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
DECLARE
    -- Fixed UUIDs for the test accounts so running this script multiple times won't duplicate profiles
    -- but it WILL throw an error if you try to run it twice without deleting the users first.
    c1 UUID := gen_random_uuid();
    c2 UUID := gen_random_uuid();
    e1 UUID := gen_random_uuid();
    
    cp1 UUID := gen_random_uuid();
    cp2 UUID := gen_random_uuid();
    ep1 UUID := gen_random_uuid();
BEGIN
    -- ==========================================
    -- 1. CLEANUP (Delete existing test users to recreate cleanly)
    -- ==========================================
    DELETE FROM auth.users WHERE email IN ('candidate1@test.com', 'candidate2@test.com', 'employer1@test.com');

    -- ==========================================
    -- 2. AUTH USERS & IDENTITIES
    -- ==========================================
    -- Password is: password123
    
    -- Candidate 1
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (c1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'candidate1@test.com', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Test Candidate 1","role":"candidate"}', NOW(), NOW());
    
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), c1, format('{"sub":"%s","email":"%s"}', c1::text, 'candidate1@test.com')::jsonb, 'email', c1::text, NOW(), NOW(), NOW());

    -- Candidate 2
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (c2, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'candidate2@test.com', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Test Candidate 2","role":"candidate"}', NOW(), NOW());

    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), c2, format('{"sub":"%s","email":"%s"}', c2::text, 'candidate2@test.com')::jsonb, 'email', c2::text, NOW(), NOW(), NOW());

    -- Employer 1
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (e1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'employer1@test.com', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Test Employer","role":"employer"}', NOW(), NOW());

    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), e1, format('{"sub":"%s","email":"%s"}', e1::text, 'employer1@test.com')::jsonb, 'email', e1::text, NOW(), NOW(), NOW());

    -- Fetch the exact IDs for the public user updates
    SELECT id INTO c1 FROM auth.users WHERE email = 'candidate1@test.com';
    SELECT id INTO c2 FROM auth.users WHERE email = 'candidate2@test.com';
    SELECT id INTO e1 FROM auth.users WHERE email = 'employer1@test.com';

    -- ==========================================
    -- 2. PUBLIC USERS
    -- ==========================================
    UPDATE public.users SET onboarding_complete = true 
    WHERE id IN (c1, c2, e1);

    -- ==========================================
    -- 3. PROFILES
    -- ==========================================
    INSERT INTO public.candidates (id, user_id, headline, career_goals, target_regions, salary_min, salary_max, availability, potential_score, is_public)
    VALUES 
    (cp1, c1, 'Junior Web Developer (Test Account)', ARRAY['Frontend Dev'], ARRAY['Remote'], 50000, 80000, 'immediate', 75.0, true),
    (cp2, c2, 'UX/UI Designer (Test Account)', ARRAY['Product Designer'], ARRAY['Remote'], 60000, 90000, 'immediate', 85.0, true)
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO public.employers (id, user_id, company_name, company_size, industry, website, plan)
    VALUES 
    (ep1, e1, 'Test Startup Inc', 'startup', 'Technology', 'https://example.com', 'startup')
    ON CONFLICT (user_id) DO NOTHING;

END $$;
