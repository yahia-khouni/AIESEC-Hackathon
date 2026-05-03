import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load env vars
dotenv.config({ path: resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function seedRichData() {
  console.log('--- Generating Rich Test Data ---');

  const accounts = [
    { email: 'candidate1@test.com', name: 'Alex Developer', role: 'candidate', headline: 'Senior React Developer', score: 85.5 },
    { email: 'candidate2@test.com', name: 'Sarah UI/UX', role: 'candidate', headline: 'Lead UX Designer', score: 92.0 },
    { email: 'employer1@test.com', name: 'TechCorp HR', role: 'employer', company: 'TechCorp Innovators' }
  ];

  const userIds: Record<string, string> = {};

  // 1. Create or Reset Users
  for (const account of accounts) {
    const { data: usersData } = await supabase.auth.admin.listUsers();
    const existing = usersData.users.find(u => u.email === account.email);
    if (existing) {
      await supabase.auth.admin.deleteUser(existing.id);
    }

    const { data: authData } = await supabase.auth.admin.createUser({
      email: account.email,
      password: 'password123',
      email_confirm: true,
      user_metadata: { full_name: account.name, role: account.role }
    });

    const userId = authData.user!.id;
    userIds[account.email] = userId;
    
    // Upsert public user directly to be safe
    await supabase.from('users').upsert({
      id: userId,
      email: account.email,
      full_name: account.name,
      role: account.role,
      onboarding_complete: true
    });

    if (account.role === 'candidate') {
      const { data: candidateRow, error: cErr } = await supabase.from('candidates').insert({
        user_id: userId,
        headline: account.headline,
        career_goals: ['Lead Role'], target_regions: ['Remote'],
        salary_min: 70000, salary_max: 120000, potential_score: account.score, is_public: true
      }).select('id').single();
      
      if (cErr) console.error(cErr);
      userIds[`${account.email}_profile_id`] = candidateRow?.id;
    } else {
      const { data: empRow, error: eErr } = await supabase.from('employers').insert({
        user_id: userId,
        company_name: account.company, company_size: 'enterprise', industry: 'Software', plan: 'enterprise'
      }).select('id').single();

      if (eErr) console.error(eErr);
      userIds[`${account.email}_profile_id`] = empRow?.id;
    }
  }

  const c1_id = userIds['candidate1@test.com_profile_id'];
  const c2_id = userIds['candidate2@test.com_profile_id'];
  const e1_id = userIds['employer1@test.com_profile_id'];

  if (!c1_id || !c2_id || !e1_id) {
    console.error('Failed to get profile IDs');
    return;
  }

  // 2. Ensure basic skills exist and get their IDs
  const skillNames = ['React.js', 'Node.js', 'Figma', 'TypeScript', 'Communication'];
  const skills: Record<string, string> = {};
  
  for (const name of skillNames) {
    let { data: skill } = await supabase.from('skills').select('id').eq('name', name).single();
    if (!skill) {
      const { data: newSkill } = await supabase.from('skills').insert({ name, category: 'technical', demand_score: 90 }).select('id').single();
      skill = newSkill;
    }
    if (skill) skills[name] = skill.id;
  }

  console.log('Seeding candidate skills, credentials, and assessments...');

  // 3. Insert Candidate Skills
  await supabase.from('candidate_skills').insert([
    { candidate_id: c1_id, skill_id: skills['React.js'], proficiency: 'advanced', verified: true, source: 'assessment' },
    { candidate_id: c1_id, skill_id: skills['Node.js'], proficiency: 'intermediate', verified: true, source: 'credential' },
    { candidate_id: c1_id, skill_id: skills['TypeScript'], proficiency: 'advanced', verified: true, source: 'ai_extracted' },
    { candidate_id: c2_id, skill_id: skills['Figma'], proficiency: 'expert', verified: true, source: 'assessment' },
    { candidate_id: c2_id, skill_id: skills['Communication'], proficiency: 'expert', verified: true, source: 'ai_extracted' },
  ]);

  // 4. Insert Credentials
  await supabase.from('credentials').insert([
    { candidate_id: c1_id, provider: 'udemy', title: 'Advanced React & TypeScript', verified: true, credential_url: 'https://udemy.com' },
    { candidate_id: c2_id, provider: 'coursera', title: 'Google UX Design Professional', verified: true, credential_url: 'https://coursera.org' }
  ]);

  // 5. Insert Assessments
  await supabase.from('assessments').insert([
    { candidate_id: c1_id, skill_id: skills['React.js'], type: 'quiz', score: 95, max_score: 100, proctored: true },
    { candidate_id: c2_id, skill_id: skills['Figma'], type: 'project', score: 98, max_score: 100, proctored: false }
  ]);

  // 6. Insert Potential Scores (History)
  await supabase.from('potential_scores').insert([
    { candidate_id: c1_id, total_score: 85.5, learning_velocity: 90, skill_gap_closure: 80, assessment_performance: 88, project_consistency: 85 },
    { candidate_id: c2_id, total_score: 92.0, learning_velocity: 95, skill_gap_closure: 90, assessment_performance: 98, project_consistency: 88 }
  ]);

  console.log('Seeding roadmaps...');

  // 7. Insert Roadmaps
  await supabase.from('roadmaps').insert([
    {
      candidate_id: c1_id,
      target_role: 'Full Stack Tech Lead',
      completion_pct: 35.0,
      status: 'active',
      phases: [
        { title: "Advanced React Patterns", duration_weeks: 4, milestones: [{title: "Custom Hooks", completed: true}, {title: "Performance Optimization", completed: false}] },
        { title: "System Architecture", duration_weeks: 6, milestones: [{title: "Microservices", completed: false}] }
      ]
    },
    {
      candidate_id: c2_id,
      target_role: 'Design Director',
      completion_pct: 10.0,
      status: 'active',
      phases: [
        { title: "Leadership & Strategy", duration_weeks: 8, milestones: [{title: "Team Management", completed: false}] }
      ]
    }
  ]);

  console.log('Seeding jobs, internships and applications...');

  // 8. Insert Jobs & Internships
  const { data: jobData } = await supabase.from('job_posts').insert([
    { employer_id: e1_id, title: 'Senior React Developer', description: 'Lead our frontend.', min_potential_score: 80, type: 'full_time', status: 'active', salary_min: 100000, salary_max: 130000 },
    { employer_id: e1_id, title: 'Lead Product Designer', description: 'Own our UX.', min_potential_score: 85, type: 'full_time', status: 'active', salary_min: 90000, salary_max: 120000 }
  ]).select();

  const { data: intData } = await supabase.from('internships').insert([
    { employer_id: e1_id, title: 'Frontend Micro-internship', description: 'Build a small widget.', category: 'dev', duration_weeks: 4, is_paid: true, compensation: 1500, status: 'open' }
  ]).select();

  if (intData && intData.length > 0) {
    // 9. Insert Applications
    await supabase.from('internship_applications').insert([
      { internship_id: intData[0].id, candidate_id: c1_id, status: 'accepted' }
    ]);
  }

  console.log('\n✅ Accounts successfully wiped, recreated, and fully loaded with rich MVP data!');
}

seedRichData().catch(console.error);
