# 🟢 Souhaib — Implementation Plan

> **Branch:** `feat/souhaib`
> **Ownership:** Employer-Side + Marketplace + Matching + Admin + Notifications
> **Merge target:** `main`

---

## Overview

Souhaib owns the **employer experience**, the **marketplace**, the **matching engine**, the **admin dashboard**, and the **notification system**. He branches off `main` after the shared Phase 0 setup (done together with Yahia).

### Ownership Map

| Area | Souhaib Owns |
|---|---|
| Employer portal | Dashboard, talent search, pipeline, job posts, settings |
| Matching engine | Candidate-job matching, blind hiring, talent futures |
| Marketplace | Micro-internship posting, applications, ratings, reviews |
| Notifications | In-app + email notifications via Resend |
| Institution portal | University dashboard, cohorts, analytics |
| Admin dashboard | User management, moderation, platform analytics |
| Salary benchmarking | AI salary benchmark tool |

### Files Souhaib Should NOT Touch (Yahia's territory)

```
app/(auth)/*
app/(candidate)/profile/*
app/(candidate)/roadmap/*
app/(candidate)/credentials/*
app/(candidate)/assessments/*
app/(candidate)/onboarding/*
app/page.tsx                    # Landing page
lib/ai/openrouter.client.ts     # Yahia builds, Souhaib uses
lib/ai/resume-parser.ts
lib/ai/skill-extractor.ts
lib/ai/roadmap-generator.ts
lib/services/candidate.service.ts
lib/services/scoring.service.ts
lib/services/roadmap.service.ts
lib/services/credential.service.ts
```

---

## Phase 0 — Shared Setup (Day 1, first 2–3 hours)

> ⚠️ **Done together with Yahia on `main`.** See Yahia's plan for full details.

After Phase 0 is committed to `main`:

```bash
git checkout -b feat/souhaib
```

---

## Phase 1 — Employer Profile & Onboarding (Day 1, hours 3–6)

### Step 1.1 — Employer Onboarding Flow

**File:** `src/app/(employer)/onboarding/page.tsx`

Multi-step form (2–3 steps):

1. **Company Info** — Company name, industry, size (startup/SME/enterprise), website, logo upload
2. **Hiring Needs** — What roles are you hiring for? Regions? Team size?
3. **Plan Selection** — Show SaaS tiers (Free Trial / Startup / Growth / Enterprise) — display-only for now, default to Free

On completion: create `employers` row, set `onboarding_complete = true`, redirect to employer dashboard.

### Step 1.2 — Employer Service

**File:** `src/lib/services/employer.service.ts`

```typescript
export const employerService = {
  async getProfile(userId: string): Promise<EmployerProfile>;
  async updateProfile(employerId: string, data: Partial<EmployerProfile>): Promise<void>;
  async uploadLogo(employerId: string, file: File): Promise<string>;
  async getPlan(employerId: string): Promise<PlanDetails>;
  async decrementViewCount(employerId: string): Promise<number>;
};
```

### Step 1.3 — Employer Layout Shell

**File:** `src/app/(employer)/layout.tsx`

- Sidebar: Dashboard, Talent Search, Pipeline, Marketplace, Job Posts, Settings
- Top bar: Company logo, notification bell, user menu
- Plan badge in sidebar (e.g., "Startup Plan")
- Responsive sidebar

### Step 1.4 — Employer Settings

**File:** `src/app/(employer)/settings/page.tsx`

- Company profile edit
- Team management (placeholder for MVP)
- Plan & billing info (display only, no real payment)
- Notification preferences

### ✅ Checkpoint: Employer can register, onboard, and see their dashboard shell.

---

## Phase 2 — Job Posts System (Day 1, hours 6–10)

### Step 2.1 — Create Job Post Form

**File:** `src/app/(employer)/jobs/create/page.tsx`

Form fields:
- Title, description (rich text or textarea)
- Required skills (search + tag from `skills` table)
- Minimum potential score threshold (slider, 0–100)
- Region, salary range (min/max)
- Job type (full-time, part-time, contract, internship)
- Blind mode toggle (default ON)
- Status (draft / active)

On submit: insert into `job_posts` table.

### Step 2.2 — Job Posts List

**File:** `src/app/(employer)/jobs/page.tsx`

- Table/card list of employer's job posts
- Status badges (Draft, Active, Closed)
- Quick actions: Edit, Close, Duplicate
- Application count per post

### Step 2.3 — Job Post Service

**File:** `src/lib/services/job.service.ts`

```typescript
export const jobService = {
  async create(employerId: string, data: NewJobPost): Promise<JobPost>;
  async update(jobId: string, data: Partial<JobPost>): Promise<void>;
  async getByEmployer(employerId: string): Promise<JobPost[]>;
  async close(jobId: string): Promise<void>;
  async getById(jobId: string): Promise<JobPost>;
};
```

### ✅ Checkpoint: Employer can create, list, edit, and close job posts.

---

## Phase 3 — Matching Engine & Talent Search (Day 2)

### Step 3.1 — Candidate Matcher AI

**File:** `src/lib/ai/candidate-matcher.ts`

```typescript
export async function computeMatchScore(candidate: CandidateProfile, jobPost: JobPost): Promise<{
  totalScore: number;
  breakdown: {
    roleFit: number;        // 30% weight
    growthTrajectory: number; // 20%
    availabilityMatch: number; // 15%
    regionFit: number;      // 15%
    salaryFit: number;      // 10%
    languageFit: number;    // 10%
  };
}> {
  // Role fit: skill overlap percentage (candidate skills vs required skills)
  // Growth trajectory: score trend over last 90 days (positive slope = bonus)
  // Availability: exact match = 1.0, decay for longer timelines
  // Region: exact = 1.0, same continent = 0.7, remote = 0.9
  // Salary: overlap ratio of ranges
  // Language: % of required languages met
}
```

### Step 3.2 — Talent Search Page

**File:** `src/app/(employer)/talent-search/page.tsx`

**Left panel — Filters:**
- Minimum potential score (slider)
- Skills (multi-select tags)
- Region (dropdown)
- Availability (dropdown)
- Language (multi-select)
- Sort by: Match score / Potential score / Recent activity

**Right panel — Results:**
- Card list of candidates (BLIND by default):
  - Potential score gauge (large number + color ring)
  - Sub-score mini bars
  - Skills tags (verified badge ✓)
  - Availability badge
  - Region (country only, not city)
  - "View Full Profile" button (deducts view count)
  - "Bookmark" button

**NO name, photo, age, or university shown in blind mode.**

### Step 3.3 — Talent Search API

**File:** `src/app/api/matching/search/route.ts`

```typescript
export async function POST(request: NextRequest) {
  // 1. Auth check — only employers
  // 2. Check view quota (candidate_views_remaining > 0)
  // 3. Parse filter params
  // 4. Query candidates table with filters:
  //    - potential_score >= min_score
  //    - skills overlap (array intersection)
  //    - region match
  //    - availability match
  //    - is_public = true
  // 5. For each candidate, compute match score against employer preferences
  // 6. Sort by match score descending
  // 7. Strip PII fields (name, avatar, exact location)
  // 8. Return blind candidate cards
}
```

### Step 3.4 — Candidate Detail View (Blind → Full)

**File:** `src/app/(employer)/talent-search/[candidateId]/page.tsx`

- **Blind view (default):** Score, sub-scores, skills, trajectory chart, credentials list, availability — NO PII
- **Full view (after "Reveal" click):** Adds name, avatar, portfolio links, exact location
- Revealing deducts 1 from `candidate_views_remaining`
- Bookmark button with readiness threshold input

### Step 3.5 — Matching Service

**File:** `src/lib/services/matching.service.ts`

```typescript
export const matchingService = {
  async searchCandidates(filters: SearchFilters, employerId: string): Promise<BlindCandidate[]>;
  async revealCandidate(employerId: string, candidateId: string): Promise<FullCandidate>;
  async getMatchScore(candidateId: string, jobId: string): Promise<MatchResult>;
  async getRecommendations(employerId: string, jobId: string): Promise<BlindCandidate[]>;
};
```

### ✅ Checkpoint: Employer can search candidates with filters, see blind results, reveal profiles, and bookmark.

---

## Phase 4 — Talent Pipeline & Bookmarks (Day 2–3)

### Step 4.1 — Bookmark System

**File:** `src/app/(employer)/pipeline/page.tsx`

- List of bookmarked candidates
- Each bookmark shows: blind candidate card + readiness threshold + notes
- Status badges: "Watching" / "Ready!" (when score ≥ threshold)
- Sort by: date bookmarked, score, readiness gap

### Step 4.2 — Readiness Alerts

**File:** `src/app/api/cron/readiness-check/route.ts`

Vercel Cron job (runs daily):
1. Fetch all bookmarks where `notified = false`
2. For each, check if candidate's `potential_score >= readiness_threshold`
3. If yes: create notification for employer, send email via Resend, set `notified = true`

### Step 4.3 — Bookmark Service

**File:** `src/lib/services/bookmark.service.ts`

```typescript
export const bookmarkService = {
  async add(employerId: string, candidateId: string, threshold: number, notes?: string): Promise<void>;
  async remove(bookmarkId: string): Promise<void>;
  async getAll(employerId: string): Promise<BookmarkWithCandidate[]>;
  async updateThreshold(bookmarkId: string, threshold: number): Promise<void>;
};
```

### ✅ Checkpoint: Employer can bookmark candidates, set thresholds, receive alerts when ready.

---

## Phase 5 — Micro-Internship Marketplace (Day 3)

### Step 5.1 — Post Internship Form

**File:** `src/app/(employer)/marketplace/create/page.tsx`

Form:
- Title, description
- Category (data analysis, UI design, content, dev, research)
- Duration (2–4 weeks slider)
- Paid/unpaid toggle + compensation amount
- Remote toggle
- Max applicants
- Required skills (tag selector)

Validation: duration 2–4 weeks, description min 100 chars, at least 1 skill tagged.

### Step 5.2 — Marketplace Browse Page (Candidate Side)

**File:** `src/app/(candidate)/marketplace/page.tsx`

> ⚠️ This is the ONE candidate page Souhaib builds, since it connects to his marketplace backend.

- Card grid of open internships
- Filters: category, paid/unpaid, remote, skills, duration
- Each card: title, company (if not blind), duration, compensation, skills, "Apply" button
- Apply modal: short cover message + confirm

### Step 5.3 — Internship Management (Employer Side)

**File:** `src/app/(employer)/marketplace/page.tsx`

- List of posted internships with status
- Click into one → see applicants list
- Applicant cards: blind candidate info + potential score + match score
- Accept/Reject buttons
- After acceptance: status moves to `in_progress`
- When candidate submits work: employer reviews + rates (1–5 stars + text review)

### Step 5.4 — Work Submission (Candidate Side)

**File:** `src/app/(candidate)/marketplace/[internshipId]/page.tsx`

- View internship details + requirements
- Upload deliverable (file or URL)
- Rate employer (1–5 stars) — blind until both rated

### Step 5.5 — Marketplace Service

**File:** `src/lib/services/marketplace.service.ts`

```typescript
export const marketplaceService = {
  async createInternship(employerId: string, data: NewInternship): Promise<Internship>;
  async listOpen(filters?: MarketplaceFilters): Promise<Internship[]>;
  async apply(candidateId: string, internshipId: string): Promise<void>;
  async getApplicants(internshipId: string): Promise<Application[]>;
  async acceptApplicant(applicationId: string): Promise<void>;
  async rejectApplicant(applicationId: string): Promise<void>;
  async submitWork(applicationId: string, submissionUrl: string): Promise<void>;
  async rateEmployer(applicationId: string, rating: number): Promise<void>;
  async rateCandidate(applicationId: string, rating: number, review: string): Promise<void>;
  async getByEmployer(employerId: string): Promise<Internship[]>;
  async getByCandidate(candidateId: string): Promise<Application[]>;
};
```

### Step 5.6 — Marketplace API Routes

**File:** `src/app/api/marketplace/route.ts` — CRUD for internships

**File:** `src/app/api/marketplace/[id]/apply/route.ts` — Apply

**File:** `src/app/api/marketplace/[id]/rate/route.ts` — Rate

### ✅ Checkpoint: Full marketplace flow — employer posts → candidate applies → accepted → work submitted → mutual rating.

---

## Phase 6 — Notification System (Day 3–4)

### Step 6.1 — Notification Service

**File:** `src/lib/services/notification.service.ts`

```typescript
export const notificationService = {
  async create(params: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    actionUrl?: string;
  }): Promise<void>;
  
  async getAll(userId: string): Promise<Notification[]>;
  async markRead(notificationId: string): Promise<void>;
  async markAllRead(userId: string): Promise<void>;
  async getUnreadCount(userId: string): Promise<number>;
  
  async sendEmail(params: {
    to: string;
    subject: string;
    template: string;
    data: Record<string, any>;
  }): Promise<void>;
};
```

### Step 6.2 — Email Templates with Resend

**File:** `src/lib/email/templates/`

Create React Email templates:
- `welcome.tsx` — After registration
- `score-update.tsx` — Weekly score summary
- `readiness-alert.tsx` — Bookmarked candidate ready
- `internship-accepted.tsx` — Application accepted
- `internship-rated.tsx` — New rating received

### Step 6.3 — Notification Bell Component

**File:** `src/components/shared/notification-bell.tsx`

- Bell icon with unread count badge
- Dropdown panel showing recent notifications
- Click notification → navigate to `action_url`
- "Mark all as read" button
- Use Supabase Realtime to update count live

### Step 6.4 — Notification API Routes

**File:** `src/app/api/notifications/route.ts` — GET all, POST mark read

### ✅ Checkpoint: In-app notifications appear in bell, emails send via Resend, real-time updates.

---

## Phase 7 — Employer Dashboard (Day 4)

### Step 7.1 — Dashboard Page

**File:** `src/app/(employer)/dashboard/page.tsx`

**Layout:**

```
┌────────────────────────┬──────────────────────┐
│ Active Job Posts       │ Pipeline Summary     │
│ (count + list)         │ (bookmarks + ready)  │
├────────────────────────┴──────────────────────┤
│ AI Recommended Candidates                     │
│ (top 5 matches for active jobs)               │
├────────────────────┬──────────────────────────┤
│ Marketplace Stats  │ Recent Activity          │
│ (active, completed)│ (notifications feed)     │
├────────────────────┴──────────────────────────┤
│ Views Remaining: XX / 100  [Upgrade Plan]     │
└───────────────────────────────────────────────┘
```

### Step 7.2 — AI Recommendations Widget

**File:** `src/components/employer/recommended-candidates.tsx`

For each active job post, run matching against all public candidates and show top 5:
- Blind candidate card with match score
- "View" and "Bookmark" buttons

### Step 7.3 — Salary Benchmarking Tool

**File:** `src/lib/ai/salary-benchmark.ts`

```typescript
export async function getSalaryBenchmark(params: {
  role: string;
  region: string;
  skillLevel: string;
}): Promise<{ p25: number; p50: number; p75: number; currency: string }> {
  // Use OpenRouter (GPT-4o-mini) with cached market data prompts
  // Return percentile salary ranges
}
```

Display in employer dashboard as a salary range bar chart.

---

## Phase 8 — Institution Portal (Day 4)

### Step 8.1 — Institution Layout

**File:** `src/app/(institution)/layout.tsx`

Sidebar: Dashboard, Cohorts, Analytics, Settings

### Step 8.2 — Institution Dashboard

**File:** `src/app/(institution)/dashboard/page.tsx`

- Total students on platform
- Average potential score
- Top skills in cohort
- Placement rate (% of students with completed internships)

### Step 8.3 — Cohort Management

**File:** `src/app/(institution)/cohorts/page.tsx`

- Create cohort (name, graduation date)
- Add students by email (must already be registered candidates)
- View cohort analytics: avg score, top skills, progress distribution chart

---

## Phase 9 — Admin Dashboard (Day 4–5)

### Step 9.1 — Admin Layout

**File:** `src/app/(admin)/layout.tsx`

Sidebar: Overview, Users, Moderation, Analytics

### Step 9.2 — Admin Overview

**File:** `src/app/(admin)/dashboard/page.tsx`

- Total users (by role)
- New registrations (last 7/30 days chart)
- Active internships
- Platform-wide average score
- Revenue summary (placeholder)

### Step 9.3 — User Management

**File:** `src/app/(admin)/users/page.tsx`

- Searchable table of all users
- Filter by role, status, date
- Actions: View profile, suspend, delete

### Step 9.4 — Moderation Queue

**File:** `src/app/(admin)/moderation/page.tsx`

- Flagged internships (spam reports)
- Disputed ratings
- Unverified credentials requiring manual review
- Action buttons: Approve, Reject, Warn

---

## 📋 Day-by-Day Summary

| Day | Tasks | Deliverables |
|---|---|---|
| **Day 1 (AM)** | Phase 0: Project setup (with Yahia on `main`) | Shared foundation |
| **Day 1 (PM)** | Phase 1: Employer onboarding + layout | Employer registration, onboarding, shell |
| **Day 1 (Eve)** | Phase 2: Job posts CRUD | Create/list/edit/close job posts |
| **Day 2** | Phase 3: Matching engine + talent search | Blind search, match scoring, candidate reveal |
| **Day 2–3** | Phase 4: Pipeline + bookmarks | Bookmark system, readiness alerts |
| **Day 3** | Phase 5: Marketplace | Full micro-internship lifecycle |
| **Day 3–4** | Phase 6: Notification system | In-app + email notifications |
| **Day 4 (AM)** | Phase 7: Employer dashboard | Dashboard with widgets + AI recommendations |
| **Day 4 (PM)** | Phase 8: Institution portal + Phase 9: Admin dashboard | Basic institution + admin UIs |
| **Day 5** | Polish, bug fixes, merge prep | Clean code, resolve conflicts, integration testing |

---

## 🔀 Merge Strategy

1. **Day 3 end:** Create PR `feat/souhaib → main`. Do NOT merge yet.
2. **Day 4:** Yahia also creates PR. Both review each other's PRs.
3. **Day 5 morning:** Yahia merges first (has shared auth/foundation). Souhaib rebases:

```bash
git fetch origin
git rebase origin/main
# Resolve any conflicts (mostly in shared files)
git push --force-with-lease
```

4. Then merge Souhaib's PR.
5. Both test the integrated app together.

### Conflict Prevention Rules

- Souhaib owns: `src/app/(employer)/*`, `src/app/(institution)/*`, `src/app/(admin)/*`, `src/app/api/matching/*`, `src/app/api/marketplace/*`, `src/app/api/notifications/*`, `src/lib/services/employer.service.ts`, `src/lib/services/matching.service.ts`, `src/lib/services/marketplace.service.ts`, `src/lib/services/notification.service.ts`, `src/lib/services/bookmark.service.ts`, `src/lib/services/job.service.ts`, `src/lib/ai/candidate-matcher.ts`, `src/lib/ai/salary-benchmark.ts`, `src/components/employer/*`, `src/components/admin/*`, `src/components/shared/notification-bell.tsx`
- **Exception:** Souhaib builds `src/app/(candidate)/marketplace/*` (marketplace browse + apply for candidates)
- Shared files (coordinate changes): `src/types/index.ts`, `src/middleware.ts`, `src/app/layout.tsx`, `src/lib/db/*`
- If either dev needs to modify a shared file, communicate first.

---

## 🔗 Dependencies on Yahia's Work

| What Souhaib Needs | From Yahia | Workaround if Not Ready |
|---|---|---|
| `candidates` table populated | Candidate onboarding | Seed 10 test candidates directly in Supabase |
| `potential_score` on candidates | Scoring engine | Set mock scores (50–90) on test candidates |
| `candidate_skills` populated | Skill extractor | Manually insert test skills |
| `openrouter.client.ts` | AI client | Copy the implementation from architecture doc |
| Auth middleware | Auth system | Use basic Supabase auth check inline |

> 💡 **Tip:** Seed test data early. On Day 1, insert 10–20 fake candidate rows with scores and skills directly in Supabase SQL Editor so you can build and test employer features without waiting for Yahia's candidate code.
