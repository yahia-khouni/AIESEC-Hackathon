# PotentialHire — Full System Architecture

> AI-Powered Employment Platform: Hiring by Future Potential, Not Past Credentials

**Version:** 1.0 · **Date:** May 2026 · **Classification:** Investor-Grade Technical Architecture

---

## Table of Contents

- [1. Executive Summary](#1-executive-summary)
- [2. Product Architecture Overview](#2-product-architecture-overview)
- [3. System Architecture (Technical)](#3-system-architecture-technical)
- [4. Database Design](#4-database-design)
- [5. AI Potential Score Design](#5-ai-potential-score-design)
- [6. Matching Engine Design](#6-matching-engine-design)
- [7. Roadmap Engine Design](#7-roadmap-engine-design)
- [8. Marketplace System Design](#8-marketplace-system-design)
- See [Part 2](./architecture-part2.md) for sections 9–16

---

## 1. Executive Summary

### The Problem

The global junior job market is broken. 72% of entry-level postings require 3+ years of experience. This creates a paradox: candidates can't get hired without experience, and can't get experience without being hired. The hardest-hit groups are students, fresh graduates, career switchers, self-taught learners, and talent in emerging markets.

### The Solution

**PotentialHire** is an AI-powered employment platform that replaces backward-looking credential checks with forward-looking potential measurement. The platform generates personalized learning roadmaps, tracks verified progress, computes a transparent **Potential Score**, and matches candidates with employers based on projected readiness — not just current resumes.

### Business Value

| Stakeholder | Value Delivered |
|---|---|
| **Candidates** | Clear path to employability, verified progress, bias-free matching |
| **Employers** | Access to high-potential talent pipelines, reduced mis-hires, lower cost-per-hire |
| **Universities** | Real-time employability analytics, improved placement rates |
| **Governments/NGOs** | Measurable workforce development outcomes |

### Defensibility

1. **Network effects** — More candidates → more employer interest → more candidates
2. **Data moat** — Longitudinal learning velocity data is proprietary and compounds
3. **AI flywheel** — Every hire outcome improves matching and scoring models
4. **Ecosystem lock-in** — University/partner integrations create switching costs

---

## 2. Product Architecture Overview

### Module Map

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ Candidate    │  │ Employer     │  │ Admin / Institution  │   │
│  │ Portal       │  │ Portal       │  │ Dashboard            │   │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘   │
└─────────┼──────────────────┼────────────────────┼───────────────┘
          │                  │                    │
┌─────────▼──────────────────▼────────────────────▼───────────────┐
│                     NEXT.JS API LAYER                            │
│  Route Handlers · Server Actions · Middleware (Auth + RBAC)     │
└─────────┬──────────────────┬────────────────────┬───────────────┘
          │                  │                    │
┌─────────▼──────────────────▼────────────────────▼───────────────┐
│                      SERVICE LAYER                              │
│  ┌────────┐ ┌────────┐ ┌─────────┐ ┌──────────┐ ┌───────────┐  │
│  │ Auth   │ │ User   │ │ Profile │ │ Employer │ │ Matching  │  │
│  │Service │ │Service │ │ Service │ │ Service  │ │ Service   │  │
│  └────────┘ └────────┘ └─────────┘ └──────────┘ └───────────┘  │
│  ┌────────┐ ┌────────┐ ┌─────────┐ ┌──────────┐ ┌───────────┐  │
│  │Scoring │ │Roadmap │ │Credentl.│ │Marketplc.│ │Notification│ │
│  │Engine  │ │Engine  │ │ Verify  │ │ Service  │ │  Service  │  │
│  └────────┘ └────────┘ └─────────┘ └──────────┘ └───────────┘  │
│  ┌────────┐ ┌────────┐                                          │
│  │Billing │ │Analytcs│                                          │
│  │Service │ │Service │                                          │
│  └────────┘ └────────┘                                          │
└─────────┬──────────────────┬────────────────────┬───────────────┘
          │                  │                    │
┌─────────▼──────────────────▼────────────────────▼───────────────┐
│                       AI LAYER                                  │
│  OpenRouter API → LLM Orchestration                             │
│  ┌────────────┐ ┌────────────┐ ┌─────────────┐ ┌────────────┐  │
│  │ Resume     │ │ Roadmap    │ │ Candidate   │ │ Salary     │  │
│  │ Parser     │ │ Generator  │ │ Matcher     │ │ Benchmark  │  │
│  └────────────┘ └────────────┘ └─────────────┘ └────────────┘  │
│  ┌────────────┐ ┌────────────┐                                  │
│  │ Skill      │ │ Scoring    │                                  │
│  │ Extractor  │ │ Predictor  │                                  │
│  └────────────┘ └────────────┘                                  │
└─────────┬──────────────────┬────────────────────────────────────┘
          │                  │
┌─────────▼──────────────────▼────────────────────────────────────┐
│                      DATA LAYER                                 │
│  ┌──────────────┐  ┌───────┐  ┌───────────────────────────┐    │
│  │ Supabase     │  │ Redis │  │ Supabase Storage (S3)     │    │
│  │ PostgreSQL   │  │ Cache │  │ Resumes, Avatars, Files   │    │
│  └──────────────┘  └───────┘  └───────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Module Interactions

| Flow | Path |
|---|---|
| Candidate signs up | Client → Auth Service → User Service → Profile Service → Supabase |
| Resume uploaded | Client → Profile Service → AI Layer (Resume Parser + Skill Extractor) → Supabase |
| Roadmap generated | Profile Service → AI Layer (Roadmap Generator via OpenRouter) → Supabase |
| Score computed | Scoring Engine pulls (credentials, progress, assessments) → weighted formula → Supabase |
| Employer searches | Employer Portal → Matching Service → Supabase (filtered query) → Blind results |
| Micro-internship | Employer posts → Marketplace Service → Candidate applies → Work → Rating → Score update |

---

## 3. System Architecture (Technical)

### 3.1 Frontend

| Component | Technology | Rationale |
|---|---|---|
| Framework | **Next.js 15 (App Router)** | SSR/SSG for SEO, React Server Components for performance |
| Language | **TypeScript** | Type safety across full stack |
| Styling | **Tailwind CSS v4** | Utility-first, rapid iteration |
| UI Library | **shadcn/ui** | Accessible, customizable, no vendor lock-in |
| State | **Zustand** | Lightweight client state for dashboards |
| Forms | **React Hook Form + Zod** | Validated forms with schema inference |
| Charts | **Recharts** | Progress visualization, analytics dashboards |
| File Upload | **UploadThing or Supabase Storage SDK** | Resume/portfolio uploads |

**Portal Architecture:**

```
app/
├── (auth)/                    # Login, Register, Forgot Password
│   ├── login/
│   ├── register/
│   └── reset-password/
├── (candidate)/               # Candidate Portal
│   ├── dashboard/
│   ├── profile/
│   ├── roadmap/
│   ├── assessments/
│   ├── credentials/
│   ├── marketplace/
│   └── settings/
├── (employer)/                # Employer Portal
│   ├── dashboard/
│   ├── talent-search/
│   ├── pipeline/
│   ├── marketplace/
│   ├── billing/
│   └── settings/
├── (institution)/             # University/NGO Portal
│   ├── dashboard/
│   ├── cohorts/
│   ├── analytics/
│   └── settings/
├── (admin)/                   # Internal Admin
│   ├── users/
│   ├── moderation/
│   ├── analytics/
│   └── partnerships/
└── api/                       # API Route Handlers
    ├── auth/
    ├── candidates/
    ├── employers/
    ├── matching/
    ├── scoring/
    ├── roadmap/
    ├── marketplace/
    ├── credentials/
    ├── notifications/
    └── webhooks/
```

### 3.2 Backend (Next.js API Layer — Phase 1)

All backend logic lives inside Next.js for Phase 1 to minimize infrastructure complexity.

| Concern | Implementation |
|---|---|
| **API Gateway** | Next.js middleware — rate limiting, auth checks, RBAC |
| **Auth Service** | Supabase Auth (email/password, OAuth — Google, GitHub, LinkedIn) |
| **Route Handlers** | `app/api/*/route.ts` — RESTful endpoints |
| **Server Actions** | Form mutations, score recalculation triggers |
| **Background Jobs** | Vercel Cron + Inngest (score recalculation, roadmap updates, notifications) |
| **Validation** | Zod schemas shared between client and server |

**Service Module Organization:**

```
lib/
├── services/
│   ├── auth.service.ts
│   ├── user.service.ts
│   ├── candidate.service.ts
│   ├── employer.service.ts
│   ├── matching.service.ts
│   ├── scoring.service.ts
│   ├── roadmap.service.ts
│   ├── credential.service.ts
│   ├── marketplace.service.ts
│   ├── notification.service.ts
│   ├── billing.service.ts
│   └── analytics.service.ts
├── ai/
│   ├── openrouter.client.ts      # OpenRouter SDK wrapper
│   ├── resume-parser.ts
│   ├── skill-extractor.ts
│   ├── roadmap-generator.ts
│   ├── candidate-matcher.ts
│   ├── scoring-predictor.ts
│   └── salary-benchmark.ts
├── db/
│   ├── supabase.client.ts         # Server-side Supabase client
│   ├── supabase.browser.ts        # Browser-side Supabase client
│   └── queries/                   # Typed query builders
└── utils/
    ├── validation/                # Zod schemas
    ├── constants.ts
    └── helpers.ts
```

### 3.3 AI Layer

All AI operations route through **OpenRouter API**, enabling model flexibility (GPT-4o, Claude, Llama, Gemini) without vendor lock-in.

| AI Module | Model Strategy | Input | Output |
|---|---|---|---|
| **Resume Parser** | GPT-4o (structured output) | PDF/DOCX file | Structured JSON: skills, experience, education |
| **Skill Extractor** | GPT-4o-mini | Resume JSON + profile data | Normalized skill taxonomy with proficiency levels |
| **Roadmap Generator** | Claude 3.5 Sonnet | Current skills, target role, region, market data | Phased learning roadmap with resources and milestones |
| **Candidate-Job Matcher** | Embedding model + GPT-4o | Candidate profile vector + job requirements | Match score (0-100) with explanation |
| **Scoring Predictor** | Custom weighted formula + LLM verification | Multi-signal inputs | Potential Score (0-100) with sub-scores |
| **Salary Benchmark** | GPT-4o-mini + cached market data | Role, region, skill level | Salary range (P25, P50, P75) |
| **Recommendation Engine** | Embedding similarity search | Employer preferences | Ranked candidate list |

**OpenRouter Integration Pattern:**

```typescript
// lib/ai/openrouter.client.ts
const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

export async function aiComplete<T>(params: {
  model: string;
  systemPrompt: string;
  userPrompt: string;
  responseSchema: ZodSchema<T>;
  temperature?: number;
}): Promise<T> {
  const response = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: params.model,
      messages: [
        { role: "system", content: params.systemPrompt },
        { role: "user", content: params.userPrompt },
      ],
      temperature: params.temperature ?? 0.3,
      response_format: { type: "json_object" },
    }),
  });
  const data = await response.json();
  return params.responseSchema.parse(JSON.parse(data.choices[0].message.content));
}
```

### 3.4 Data Layer

| Store | Technology | Purpose |
|---|---|---|
| **Primary DB** | Supabase PostgreSQL | All relational data — users, profiles, scores, jobs, credentials |
| **Cache** | Upstash Redis (serverless) | Session cache, rate limiting, hot score lookups, leaderboard |
| **Object Storage** | Supabase Storage (S3-compatible) | Resumes, avatars, portfolio files, internship deliverables |
| **Full-Text Search** | Supabase `pg_trgm` + `tsvector` | Talent search, skill search, job search |
| **Vector Store** | Supabase `pgvector` extension | Embedding-based candidate-job similarity matching |
| **Real-time** | Supabase Realtime | Live notifications, dashboard updates |

**Why this stack:**
- **Supabase PostgreSQL** — Single managed database with Row Level Security, real-time subscriptions, and pgvector built in. Eliminates need for separate vector DB.
- **Upstash Redis** — Serverless Redis with per-request pricing, perfect for Vercel Edge.
- **Supabase Storage** — Integrated with auth, RLS policies apply to files.

### 3.5 Infrastructure

| Concern | Technology | Rationale |
|---|---|---|
| **Hosting** | Vercel | Native Next.js support, edge functions, preview deployments |
| **Database** | Supabase (managed) | Postgres + Auth + Storage + Realtime in one |
| **Background Jobs** | Inngest (on Vercel) | Event-driven, retryable, observable serverless functions |
| **Cron** | Vercel Cron | Scheduled score recalculations, roadmap updates |
| **Email** | Resend | Transactional emails, React Email templates |
| **CDN** | Vercel Edge Network | Global static asset delivery |
| **Monitoring** | Vercel Analytics + Sentry | Performance monitoring, error tracking |
| **Logging** | Axiom (Vercel integration) | Structured log aggregation |
| **Secrets** | Vercel Environment Variables | Encrypted, per-environment |
| **CI/CD** | GitHub Actions + Vercel | Auto-deploy on push, preview on PR |
| **Feature Flags** | Vercel Flags (or LaunchDarkly) | Progressive rollouts |

---

## 4. Database Design

### Entity-Relationship Overview

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│  users   │────<│  candidates  │────<│   skills     │
│          │     │              │     │ (candidate_  │
│          │     │              │     │  skills)     │
└──────────┘     └──────────────┘     └──────────────┘
     │                  │                    │
     │                  │              ┌─────▼──────┐
     │                  ├─────────────<│  roadmaps  │
     │                  │              └────────────┘
     │                  │              ┌────────────┐
     │                  ├─────────────<│assessments │
     │                  │              └────────────┘
     │                  │              ┌────────────┐
     │                  ├─────────────<│credentials │
     │                  │              └────────────┘
     │                  │              ┌────────────────┐
     │                  └─────────────<│potential_scores│
     │                                 └────────────────┘
     │
     │           ┌──────────────┐     ┌────────────┐
     ├──────────<│  employers   │────<│  job_posts │
     │           └──────────────┘     └────────────┘
     │                  │              ┌────────────┐
     │                  └─────────────<│ bookmarks  │
     │
     │           ┌──────────────┐     ┌────────────┐
     ├──────────<│universities  │────<│  cohorts   │
     │           └──────────────┘     └────────────┘
     │
     │           ┌──────────────────┐
     ├──────────<│  notifications   │
     │           └──────────────────┘
     │
     │           ┌──────────────────┐  ┌────────────────────┐
     └──────────<│  internships     │─<│internship_applics  │
                 └──────────────────┘  └────────────────────┘
```

### Core Tables

#### `users`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | Supabase Auth UID |
| email | text | Unique, indexed |
| role | enum | `candidate`, `employer`, `institution`, `admin` |
| full_name | text | |
| avatar_url | text | Supabase Storage path |
| onboarding_complete | boolean | Default false |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### `candidates`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| user_id | uuid (FK → users) | Unique |
| headline | text | Short bio |
| resume_url | text | Storage path |
| resume_parsed | jsonb | AI-extracted structured data |
| career_goals | text[] | Target roles |
| target_regions | text[] | Country/city preferences |
| salary_min / salary_max | integer | Expected range |
| languages | jsonb | `[{lang, level}]` |
| portfolio_links | text[] | |
| availability | enum | `immediate`, `1_month`, `3_months`, `6_months` |
| potential_score | numeric(5,2) | Denormalized current score |
| score_updated_at | timestamptz | |
| profile_embedding | vector(1536) | pgvector — for similarity matching |
| is_public | boolean | Opt-in to employer visibility |

#### `employers`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| user_id | uuid (FK → users) | |
| company_name | text | |
| company_size | enum | `startup`, `sme`, `enterprise` |
| industry | text | |
| website | text | |
| logo_url | text | |
| plan | enum | `free`, `startup`, `growth`, `enterprise` |
| team_seats | integer | |
| candidate_views_remaining | integer | Monthly quota |

#### `skills`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| name | text | Normalized skill name |
| category | text | `technical`, `soft`, `domain` |
| demand_score | numeric | Market demand index |

#### `candidate_skills`
| Column | Type | Notes |
|---|---|---|
| candidate_id | uuid (FK) | |
| skill_id | uuid (FK) | |
| proficiency | enum | `beginner`, `intermediate`, `advanced`, `expert` |
| verified | boolean | Through assessment or credential |
| source | text | `self_reported`, `ai_extracted`, `assessment`, `credential` |

#### `roadmaps`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| candidate_id | uuid (FK) | |
| target_role | text | |
| phases | jsonb | `[{title, duration, milestones[], resources[]}]` |
| completion_pct | numeric(5,2) | |
| status | enum | `active`, `completed`, `paused` |
| generated_by_model | text | AI model used |
| last_adapted_at | timestamptz | Last dynamic update |

#### `assessments`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| candidate_id | uuid (FK) | |
| skill_id | uuid (FK) | |
| type | enum | `quiz`, `project`, `simulation`, `peer_review` |
| score | numeric(5,2) | 0–100 |
| max_score | numeric(5,2) | |
| completed_at | timestamptz | |
| proctored | boolean | |

#### `potential_scores`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| candidate_id | uuid (FK) | |
| total_score | numeric(5,2) | Composite 0–100 |
| learning_velocity | numeric(5,2) | Sub-score |
| skill_gap_closure | numeric(5,2) | Sub-score |
| assessment_performance | numeric(5,2) | Sub-score |
| project_consistency | numeric(5,2) | Sub-score |
| credential_quality | numeric(5,2) | Sub-score |
| roadmap_progress | numeric(5,2) | Sub-score |
| simulation_performance | numeric(5,2) | Sub-score |
| employer_feedback | numeric(5,2) | Sub-score |
| computed_at | timestamptz | |
| model_version | text | Score algorithm version |

#### `credentials`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| candidate_id | uuid (FK) | |
| provider | text | `coursera`, `udemy`, `freecodecamp`, `university`, `internal` |
| title | text | Certificate/course name |
| credential_url | text | Verification link |
| verified | boolean | API-verified or manual |
| verified_at | timestamptz | |
| skill_ids | uuid[] | Skills this credential validates |

#### `job_posts`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| employer_id | uuid (FK) | |
| title | text | |
| description | text | |
| required_skills | uuid[] | |
| min_potential_score | numeric | Threshold |
| region | text | |
| salary_range | int4range | |
| type | enum | `full_time`, `part_time`, `contract`, `internship` |
| blind_mode | boolean | Default true for first round |
| status | enum | `draft`, `active`, `closed` |
| embedding | vector(1536) | For semantic matching |

#### `bookmarks`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| employer_id | uuid (FK) | |
| candidate_id | uuid (FK) | |
| readiness_threshold | numeric | Alert when score reaches this |
| notified | boolean | |
| notes | text | |

#### `internships` (Micro-Internship Marketplace)
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| employer_id | uuid (FK) | |
| title | text | |
| description | text | |
| category | text | `data_analysis`, `ui_design`, `content`, `dev`, `research` |
| duration_weeks | integer | 2–4 typical |
| is_paid | boolean | |
| compensation | integer | If paid |
| is_remote | boolean | |
| max_applicants | integer | |
| status | enum | `open`, `in_progress`, `completed`, `cancelled` |
| skills_required | uuid[] | |

#### `internship_applications`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| internship_id | uuid (FK) | |
| candidate_id | uuid (FK) | |
| status | enum | `applied`, `accepted`, `rejected`, `completed` |
| submission_url | text | Final deliverable |
| employer_rating | numeric(3,1) | 1–5 |
| candidate_rating | numeric(3,1) | 1–5 |
| employer_review | text | |
| completed_at | timestamptz | |

#### `universities`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| user_id | uuid (FK → users) | |
| name | text | |
| country | text | |
| type | enum | `university`, `bootcamp`, `ngo`, `government` |
| student_count | integer | |

#### `cohorts`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| university_id | uuid (FK) | |
| name | text | e.g., "CS Class of 2026" |
| candidate_ids | uuid[] | |
| graduation_date | date | |

#### `notifications`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| user_id | uuid (FK) | |
| type | enum | `score_update`, `bookmark`, `match`, `internship`, `system` |
| title | text | |
| body | text | |
| read | boolean | Default false |
| action_url | text | Deep link |
| created_at | timestamptz | |

#### `payments` (Future-ready, no real processing now)
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| employer_id | uuid (FK) | |
| type | enum | `subscription`, `success_fee`, `marketplace_commission` |
| amount | integer | Cents |
| currency | text | |
| status | enum | `pending`, `completed`, `refunded` |
| metadata | jsonb | Plan details, invoice ref |

### Row Level Security (RLS)

```sql
-- Candidates can only read/write their own profile
CREATE POLICY "candidates_own_data" ON candidates
  USING (user_id = auth.uid());

-- Employers see only public candidate profiles (blind mode fields hidden in app layer)
CREATE POLICY "employers_view_public_candidates" ON candidates
  FOR SELECT USING (is_public = true);

-- Employers manage only their own job posts
CREATE POLICY "employers_own_jobs" ON job_posts
  USING (employer_id IN (SELECT id FROM employers WHERE user_id = auth.uid()));
```
