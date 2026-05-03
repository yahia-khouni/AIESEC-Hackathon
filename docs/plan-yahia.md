# 🔵 Yahia — Implementation Plan

> **Branch:** `feat/yahia`
> **Ownership:** Candidate-Side + AI Layer + Shared Foundation
> **Merge target:** `main`

---

## Overview

Yahia owns the **candidate experience** end-to-end: everything a candidate sees, does, and benefits from — plus the **AI backbone** that powers the platform's intelligence. He also sets up the shared project foundation that Souhaib will build on top of.

### Ownership Map

| Area | Yahia Owns |
|---|---|
| Project scaffolding | Next.js init, Supabase setup, shared config |
| Auth system | Supabase Auth, login/register/reset pages |
| Candidate portal | Profile, dashboard, settings |
| AI layer | OpenRouter client, resume parser, skill extractor, roadmap generator, scoring engine |
| Roadmap engine | Generation, display, progress tracking |
| Scoring engine | Potential score computation, sub-scores, display |
| Credentials system | Add/verify credentials, credential display |
| Landing page | Public homepage |

### Files Yahia Should NOT Touch (Souhaib's territory)

```
app/(employer)/*
app/(institution)/*
app/(admin)/*
app/api/employers/*
app/api/matching/*
app/api/marketplace/*
lib/services/employer.service.ts
lib/services/matching.service.ts
lib/services/marketplace.service.ts
lib/services/notification.service.ts
lib/ai/candidate-matcher.ts
lib/ai/salary-benchmark.ts
```

---

## Phase 0 — Shared Project Setup (Day 1, first 2–3 hours)

> ⚠️ **Do this on `main` before branching.** Both devs should be present. Push to `main`, then both branch off.

### Step 0.1 — Initialize Next.js Project

```bash
npx -y create-next-app@latest ./ --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm
```

### Step 0.2 — Install Core Dependencies

```bash
pnpm add @supabase/supabase-js @supabase/ssr zod react-hook-form @hookform/resolvers zustand recharts resend
pnpm add -D @types/node prettier eslint-config-prettier
```

### Step 0.3 — Install shadcn/ui

```bash
pnpm dlx shadcn@latest init
```

Add initial components:

```bash
pnpm dlx shadcn@latest add button input card form label tabs badge separator avatar dropdown-menu dialog sheet toast sonner
```

### Step 0.4 — Set Up Environment Variables

Create `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenRouter
OPENROUTER_API_KEY=your-openrouter-key

# Resend
RESEND_API_KEY=your-resend-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Add `.env.local` to `.gitignore`. Create `.env.example` with placeholder values.

### Step 0.5 — Create Folder Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── reset-password/page.tsx
│   ├── (candidate)/
│   │   └── ...
│   ├── (employer)/
│   │   └── ...
│   ├── (institution)/
│   │   └── ...
│   ├── (admin)/
│   │   └── ...
│   ├── api/
│   │   └── ...
│   ├── layout.tsx
│   ├── page.tsx              # Landing page
│   └── globals.css
├── components/
│   ├── ui/                   # shadcn components (auto-generated)
│   ├── shared/               # Navbar, Footer, Logo, ThemeToggle
│   ├── candidate/            # Yahia's components
│   ├── employer/             # Souhaib's components
│   └── admin/                # Souhaib's components
├── lib/
│   ├── ai/
│   ├── db/
│   ├── services/
│   └── utils/
└── types/
    └── index.ts              # Shared TypeScript types
```

### Step 0.6 — Supabase Client Setup

Create `src/lib/db/supabase.server.ts`:

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}
```

Create `src/lib/db/supabase.browser.ts`:

```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createBrowserSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### Step 0.7 — Shared Types

Create `src/types/index.ts` with all shared enums and types from the architecture doc (UserRole, CandidateAvailability, SkillProficiency, etc.).

### Step 0.8 — Create Supabase Database Tables

Go to Supabase Dashboard → SQL Editor → Run the full schema creation script for ALL tables (users, candidates, employers, skills, candidate_skills, roadmaps, assessments, potential_scores, credentials, job_posts, bookmarks, internships, internship_applications, universities, cohorts, notifications, payments). Enable RLS on all tables. Add the RLS policies from the architecture doc.

> ✅ **After Step 0.8 is complete:** Commit to `main`, push, then both devs create their branches.

```bash
git add . && git commit -m "chore: project scaffolding + supabase setup"
git push origin main
git checkout -b feat/yahia    # Yahia runs this
```

---

## Phase 1 — Auth System (Day 1, hours 3–6)

### Step 1.1 — Auth Middleware

Create `src/middleware.ts`:

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(/* ... */);
  const { data: { user } } = await supabase.auth.getUser();

  const protectedPaths = ["/candidate", "/employer", "/institution", "/admin"];
  const isProtected = protectedPaths.some(p => request.nextUrl.pathname.startsWith(p));

  if (isProtected && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && (request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/register")) {
    // Redirect to appropriate dashboard based on role
    return NextResponse.redirect(new URL("/candidate/dashboard", request.url));
  }

  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"] };
```

### Step 1.2 — Register Page

**File:** `src/app/(auth)/register/page.tsx`

Build a registration form with:
- Full name
- Email
- Password (min 8 chars)
- Role selector (Candidate / Employer / Institution)
- "Create Account" button → calls `supabase.auth.signUp()`
- On success: insert into `users` table with selected role, redirect to onboarding
- Link to login page

**Design:**
- Centered card layout
- Gradient background (dark theme)
- shadcn `Card`, `Input`, `Button`, `Label` components
- Form validation with React Hook Form + Zod

### Step 1.3 — Login Page

**File:** `src/app/(auth)/login/page.tsx`

- Email + password login
- "Forgot password?" link
- "Don't have an account? Register" link
- OAuth buttons (Google, GitHub) — use `supabase.auth.signInWithOAuth()`
- On success: redirect based on user role

### Step 1.4 — Reset Password Page

**File:** `src/app/(auth)/reset-password/page.tsx`

- Email input → `supabase.auth.resetPasswordForEmail()`
- Success message: "Check your email"

### Step 1.5 — Auth Callback Route

**File:** `src/app/api/auth/callback/route.ts`

Handle OAuth callback and email confirmation:

```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(new URL("/candidate/dashboard", request.url));
}
```

### Step 1.6 — Auth Context Provider

Create `src/components/shared/auth-provider.tsx`:

- React context that provides `user`, `session`, `signOut()`
- Wraps the app in `layout.tsx`
- Listens to `onAuthStateChange`

### ✅ Checkpoint: Auth Working

Test: Register → Login → Protected route access → Logout → Redirect to login.

---

## Phase 2 — Candidate Profile System (Day 1, hours 6–10 + Day 2 morning)

### Step 2.1 — Candidate Onboarding Flow

**File:** `src/app/(candidate)/onboarding/page.tsx`

Multi-step form (3–4 steps):

1. **Basic Info** — Headline, avatar upload (Supabase Storage), languages
2. **Career Goals** — Target roles (multi-select/tags), target regions, salary expectations, availability
3. **Skills** — Search and add skills from `skills` table, set proficiency level
4. **Resume** — Upload PDF/DOCX to Supabase Storage, trigger AI parsing

On completion: set `onboarding_complete = true`, redirect to dashboard.

**Implementation details:**
- Use Zustand store for multi-step form state
- Each step validates with Zod before allowing next
- Resume upload: `supabase.storage.from('resumes').upload()`
- Skills: Autocomplete search against `skills` table, allow custom additions

### Step 2.2 — Resume Upload + AI Parsing

**File:** `src/lib/ai/resume-parser.ts`

```typescript
export async function parseResume(resumeUrl: string): Promise<ParsedResume> {
  // 1. Download file from Supabase Storage
  // 2. Convert PDF to text (use pdf-parse package)
  // 3. Send to OpenRouter for structured extraction
  // 4. Validate response with Zod schema
  // 5. Return structured data
}
```

**File:** `src/app/api/candidates/parse-resume/route.ts`

Server action that:
1. Receives candidate ID
2. Fetches resume from storage
3. Calls `parseResume()`
4. Updates `candidates.resume_parsed` with structured JSON
5. Calls `extractSkills()` to populate `candidate_skills`

### Step 2.3 — Skill Extractor

**File:** `src/lib/ai/skill-extractor.ts`

```typescript
export async function extractSkills(parsedResume: ParsedResume, profileData: CandidateProfile) {
  // 1. Combine resume skills + profile skills
  // 2. Send to OpenRouter (GPT-4o-mini) for normalization
  // 3. Match against skills taxonomy in DB
  // 4. Return normalized skills with proficiency levels
}
```

### Step 2.4 — Candidate Profile View/Edit Page

**File:** `src/app/(candidate)/profile/page.tsx`

Tabbed layout:
- **Overview** — Name, headline, avatar, contact, languages, availability
- **Skills** — Visual skill cards with proficiency badges, add/remove
- **Career Goals** — Target roles, regions, salary expectations
- **Resume** — Upload/replace, view parsed data
- **Portfolio** — Add/remove portfolio links

Each tab has inline edit mode (click "Edit" → fields become editable → "Save").

### Step 2.5 — Candidate Profile Service

**File:** `src/lib/services/candidate.service.ts`

```typescript
export const candidateService = {
  async getProfile(userId: string): Promise<CandidateProfile>;
  async updateProfile(candidateId: string, data: Partial<CandidateProfile>): Promise<void>;
  async getSkills(candidateId: string): Promise<CandidateSkill[]>;
  async addSkill(candidateId: string, skillId: string, proficiency: string): Promise<void>;
  async removeSkill(candidateId: string, skillId: string): Promise<void>;
  async uploadResume(candidateId: string, file: File): Promise<string>;
  async getProfileCompleteness(candidateId: string): Promise<number>;
};
```

### ✅ Checkpoint: Profile Complete

Test: Onboarding flow → Profile displays correctly → Edit works → Resume uploads and AI parses it → Skills extracted and displayed.

---

## Phase 3 — AI Roadmap Engine (Day 2)

### Step 3.1 — OpenRouter Client

**File:** `src/lib/ai/openrouter.client.ts`

Implement the generic `aiComplete<T>()` function from the architecture doc. Add:
- Error handling + retry logic (3 retries with exponential backoff)
- Rate limiting awareness
- Response time logging
- Cost tracking (log model + token count)

### Step 3.2 — Roadmap Generator

**File:** `src/lib/ai/roadmap-generator.ts`

```typescript
export async function generateRoadmap(params: {
  currentSkills: CandidateSkill[];
  targetRole: string;
  targetRegion: string;
  timelineWeeks: number;
}): Promise<Roadmap> {
  // System prompt: "You are a career development AI..."
  // Include: skill gap analysis, market demand context
  // Output: phased roadmap with milestones, resources, assessments
  // Validate with RoadmapSchema (Zod)
}
```

**System prompt should include:**
- Current skills with proficiency levels
- Target role requirements (hardcoded for MVP, later fetched from job market data)
- Preferred timeline
- Free resource preference (freeCodeCamp, YouTube, MDN, etc.)
- Structure: 3–4 phases, each with milestones, resources (with URLs), and a mini-assessment

### Step 3.3 — Roadmap API Route

**File:** `src/app/api/roadmap/generate/route.ts`

```typescript
export async function POST(request: NextRequest) {
  // 1. Auth check — only candidates
  // 2. Get candidate profile + skills
  // 3. Call generateRoadmap()
  // 4. Save to roadmaps table
  // 5. Return roadmap
}
```

### Step 3.4 — Roadmap Display Page

**File:** `src/app/(candidate)/roadmap/page.tsx`

**Design — vertical timeline layout:**

```
Phase 1: Foundation (6 weeks)
├── ✅ Milestone: HTML & CSS Basics
│   ├── 📚 Resource: freeCodeCamp Responsive Web Design
│   └── 📝 Assessment: Build a landing page
├── 🔄 Milestone: JavaScript Fundamentals  ← currently here
│   ├── 📚 Resource: javascript.info
│   └── 📝 Assessment: Build a todo app
└── ⬜ Milestone: Git & GitHub
    └── 📚 Resource: GitHub Skills

Phase 2: Core Skills (8 weeks)
└── ⬜ ...
```

Components needed:
- `RoadmapTimeline` — vertical stepper
- `PhaseCard` — collapsible phase with progress bar
- `MilestoneItem` — checkbox + resources + assessment link
- `ProgressRing` — circular progress indicator for overall completion

### Step 3.5 — Milestone Completion

When candidate marks a milestone as complete:
1. Update `roadmaps.phases` JSONB (set milestone `completed: true`)
2. Recalculate `roadmaps.completion_pct`
3. Trigger score recalculation (call scoring API)
4. Show celebration animation (confetti? toast?)

### Step 3.6 — Roadmap Service

**File:** `src/lib/services/roadmap.service.ts`

```typescript
export const roadmapService = {
  async getActive(candidateId: string): Promise<Roadmap | null>;
  async generate(candidateId: string): Promise<Roadmap>;
  async completeMilestone(roadmapId: string, phaseIndex: number, milestoneIndex: number): Promise<void>;
  async getCompletionPercentage(roadmapId: string): Promise<number>;
};
```

### ✅ Checkpoint: Roadmap Working

Test: Generate roadmap for a target role → Displays in timeline → Mark milestones complete → Progress updates → Score recalculates.

---

## Phase 4 — Potential Score Engine (Day 2–3)

### Step 4.1 — Scoring Algorithm

**File:** `src/lib/services/scoring.service.ts`

```typescript
export const scoringService = {
  async computeScore(candidateId: string): Promise<PotentialScore> {
    // 1. Fetch all inputs:
    //    - Credentials (count, quality, recency)
    //    - Assessments (scores, completion rate)
    //    - Roadmap (completion %)
    //    - Internship ratings (if any)
    //    - Skill count + verified %
    //    - Timeline of activity (for velocity)
    
    // 2. Compute each sub-score (0-100):
    //    - learning_velocity: credentials per month, normalized
    //    - skill_gap_closure: % of target role skills acquired
    //    - assessment_performance: avg assessment score
    //    - project_consistency: activity spread over time (not one burst)
    //    - credential_quality: weighted by provider tier
    //    - roadmap_progress: completion_pct from active roadmap
    //    - simulation_performance: avg internship employer rating × 20
    //    - employer_feedback: avg review sentiment score × 20
    
    // 3. Apply weights from architecture doc
    // 4. Compute total_score
    // 5. Save to potential_scores table
    // 6. Update candidates.potential_score (denormalized)
    // 7. Return full score breakdown
  },
  
  async getScoreHistory(candidateId: string): Promise<PotentialScore[]>;
  async getSubScores(candidateId: string): Promise<SubScores>;
};
```

### Step 4.2 — Score API Route

**File:** `src/app/api/scoring/compute/route.ts`

- POST: Trigger score recalculation for authenticated candidate
- GET: Fetch current score + sub-scores + history

### Step 4.3 — Score Display Component

**File:** `src/components/candidate/potential-score-card.tsx`

Design a premium score card:
- Large circular score gauge (0–100) with gradient color
- 8 sub-score bars with labels and values
- Score trend line (last 30/60/90 days) using Recharts
- "+X pts this month" badge
- Tooltip explanations for each sub-score

### Step 4.4 — Score History Chart

**File:** `src/components/candidate/score-history-chart.tsx`

Recharts line chart showing score progression over time. Include sub-score toggles to show/hide individual lines.

### ✅ Checkpoint: Scoring Working

Test: Compute score → Displays with sub-scores → Add credential → Score updates → History chart shows progression.

---

## Phase 5 — Credentials System (Day 3)

### Step 5.1 — Add Credential Form

**File:** `src/app/(candidate)/credentials/page.tsx`

- Form to add a credential: provider (dropdown), title, URL, skills it covers
- "Verify" button that checks URL validity
- List of existing credentials with status badges (✅ Verified / ⏳ Pending)

### Step 5.2 — Credential Service

**File:** `src/lib/services/credential.service.ts`

```typescript
export const credentialService = {
  async add(candidateId: string, data: NewCredential): Promise<Credential>;
  async verify(credentialId: string): Promise<boolean>;  // URL check + basic validation
  async getAll(candidateId: string): Promise<Credential[]>;
  async delete(credentialId: string): Promise<void>;
};
```

### Step 5.3 — Auto-Skill Linking

When a credential is added, AI extracts which skills it validates:
1. Send credential title + provider to OpenRouter (GPT-4o-mini)
2. Match returned skills against `skills` table
3. Update `candidate_skills` — set `verified = true`, `source = 'credential'`
4. Trigger score recalculation

---

## Phase 6 — Candidate Dashboard (Day 3–4)

### Step 6.1 — Dashboard Layout

**File:** `src/app/(candidate)/dashboard/page.tsx`

**Layout — grid-based dashboard:**

```
┌───────────────────────┬──────────────────┐
│                       │                  │
│  Potential Score Card │  Hiring Readiness│
│  (large, prominent)  │  Meter           │
│                       │                  │
├───────────────────────┴──────────────────┤
│                                          │
│  Recommended Next Actions                │
│  (AI-generated action items)             │
│                                          │
├────────────────────┬─────────────────────┤
│                    │                     │
│  Roadmap Progress  │  Score History      │
│  (mini timeline)   │  (line chart)       │
│                    │                     │
├────────────────────┴─────────────────────┤
│                                          │
│  Recent Credentials  │  Notifications    │
│                      │                   │
└──────────────────────┴───────────────────┘
```

### Step 6.2 — Hiring Readiness Meter

**File:** `src/components/candidate/hiring-readiness.tsx`

- Thermometer/gauge visualization
- Levels: "Getting Started" → "Building" → "Almost Ready" → "Hire-Ready"
- Based on: potential score + profile completeness + credential count

### Step 6.3 — Recommended Next Actions

**File:** `src/components/candidate/next-actions.tsx`

AI-generated or rule-based action cards:
- "Complete your profile" (if incomplete)
- "Upload your first credential"
- "Start your next roadmap milestone"
- "Apply to a micro-internship"
- "Take a skill assessment"

### Step 6.4 — Candidate Layout Shell

**File:** `src/app/(candidate)/layout.tsx`

- Sidebar navigation: Dashboard, Profile, Roadmap, Credentials, Marketplace, Settings
- Top bar: User avatar, notification bell (badge count), sign out
- Responsive: sidebar collapses to hamburger on mobile

### ✅ Checkpoint: Dashboard Complete

Test: Dashboard shows score, readiness, progress, actions → Navigation works → Responsive layout.

---

## Phase 7 — Assessments System (Day 4)

### Step 7.1 — Simple Quiz System

**File:** `src/app/(candidate)/assessments/page.tsx`

- List of available assessments by skill
- Each assessment: 10–15 multiple-choice questions
- Timer (optional)
- Score calculated on submit
- Result saved to `assessments` table
- Triggers score recalculation

### Step 7.2 — Assessment Questions (AI-Generated)

**File:** `src/lib/ai/assessment-generator.ts`

For MVP, use OpenRouter to generate quiz questions:

```typescript
export async function generateQuiz(skillName: string, difficulty: string): Promise<QuizQuestion[]> {
  // Generate 10 multiple-choice questions
  // Include correct answer + explanation
  // Validate with Zod schema
}
```

### Step 7.3 — Assessment Results Page

Show score, correct/incorrect breakdown, skill badge earned.

---

## Phase 8 — Landing Page (Day 4)

### Step 8.1 — Public Homepage

**File:** `src/app/page.tsx`

Sections:
1. **Hero** — "Get Hired for Your Potential, Not Just Your Past" + CTA buttons (Candidate / Employer)
2. **How It Works** — 3-step visual: Build Profile → AI Roadmap → Get Matched
3. **Potential Score Preview** — Animated score mockup
4. **For Employers** — "Find tomorrow's talent today" section
5. **Partner Logos** — Universities, learning platforms
6. **CTA Footer** — "Start Your Journey" signup button

**Design:**
- Dark theme with gradient accents (indigo → violet)
- Smooth scroll animations (use `framer-motion` or CSS `@keyframes`)
- Glassmorphism cards
- Premium typography (Inter font)

---

## Phase 9 — Candidate Settings (Day 4)

### Step 9.1 — Settings Page

**File:** `src/app/(candidate)/settings/page.tsx`

- **Profile Visibility** — Toggle `is_public` (visible to employers)
- **Notification Preferences** — Email toggles
- **Change Password**
- **Delete Account** — Danger zone with confirmation
- **Export Data** — Download all personal data as JSON

---

## 📋 Day-by-Day Summary

| Day | Tasks | Deliverables |
|---|---|---|
| **Day 1 (AM)** | Phase 0: Project setup (together with Souhaib) | Working Next.js + Supabase + shadcn project on `main` |
| **Day 1 (PM)** | Phase 1: Auth system | Login, Register, Reset, middleware, auth context |
| **Day 1 (Eve)** | Phase 2 start: Onboarding + resume upload | Multi-step onboarding, resume parsing |
| **Day 2 (AM)** | Phase 2 finish: Profile pages + skill extractor | Profile view/edit, skills management |
| **Day 2 (PM)** | Phase 3: Roadmap engine | AI generation, timeline display, milestone completion |
| **Day 3 (AM)** | Phase 4: Scoring engine | Score computation, display, history chart |
| **Day 3 (PM)** | Phase 5: Credentials system | Add/verify credentials, auto-skill linking |
| **Day 4 (AM)** | Phase 6: Candidate dashboard | Full dashboard with all widgets |
| **Day 4 (PM)** | Phase 7: Assessments + Phase 8: Landing page + Phase 9: Settings | Quiz system, homepage, settings |
| **Day 5** | Polish, bug fixes, merge prep | Clean code, resolve conflicts, final testing |

---

## 🔀 Merge Strategy

1. **Day 3 end:** Create PR `feat/yahia → main`. Do NOT merge yet.
2. **Day 4:** Souhaib also creates PR. Both review each other's PRs.
3. **Day 5 morning:** Yahia merges first (he has shared foundation code). Souhaib rebases onto updated main, resolves conflicts, then merges.
4. **Day 5:** Both test the integrated app together.

### Conflict Prevention Rules

- Yahia owns: `src/app/(auth)/*`, `src/app/(candidate)/*`, `src/app/page.tsx`, `src/lib/ai/*`, `src/lib/services/candidate.service.ts`, `src/lib/services/scoring.service.ts`, `src/lib/services/roadmap.service.ts`, `src/lib/services/credential.service.ts`, `src/components/candidate/*`
- Shared files (coordinate changes): `src/types/index.ts`, `src/middleware.ts`, `src/app/layout.tsx`, `src/lib/db/*`
- If either dev needs to modify a shared file, communicate via Slack/Discord first.
