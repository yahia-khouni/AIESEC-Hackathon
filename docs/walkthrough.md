# PotentialHire — Implementation Walkthrough

## Overview

Full implementation of the PotentialHire candidate-side platform: an AI-powered employment platform that helps juniors, fresh graduates, and career switchers get hired based on **future potential** instead of past credentials.

**Stack:** Next.js 16 (App Router) · TypeScript · Supabase · Shadcn/ui (base-ui) · OpenRouter · Zod v4

---

## Screenshots

````carousel
![Landing page hero section with gradient text, CTAs, and stat counters](C:/Users/medya/.gemini/antigravity/brain/c973b7a5-69ec-4e91-9361-590b2b7f7fc9/landing_hero.png)
<!-- slide -->
![How it Works and Features sections of the landing page](C:/Users/medya/.gemini/antigravity/brain/c973b7a5-69ec-4e91-9361-590b2b7f7fc9/landing_features.png)
<!-- slide -->
![Registration page with role selector and OAuth buttons](C:/Users/medya/.gemini/antigravity/brain/c973b7a5-69ec-4e91-9361-590b2b7f7fc9/register.png)
<!-- slide -->
![Candidate dashboard with Potential Score ring, Hiring Readiness meter, and action cards](C:/Users/medya/.gemini/antigravity/brain/c973b7a5-69ec-4e91-9361-590b2b7f7fc9/dashboard.png)
<!-- slide -->
![Assessments page with skill quiz cards](C:/Users/medya/.gemini/antigravity/brain/c973b7a5-69ec-4e91-9361-590b2b7f7fc9/assessments.png)
````

---

## What Was Built

### Phase 0-1: Foundation

| Component | Files |
|-----------|-------|
| **Database Schema** | [schema.sql](file:///c:/Users/medya/projects/AIESEC-Hackathon/potential-hire/supabase/schema.sql) — 15+ tables, RLS policies, triggers |
| **Types** | [types/index.ts](file:///c:/Users/medya/projects/AIESEC-Hackathon/potential-hire/src/types/index.ts) — 30+ interfaces/types |
| **Validations** | [schemas.ts](file:///c:/Users/medya/projects/AIESEC-Hackathon/potential-hire/src/lib/validations/schemas.ts) — Zod v4 schemas for all inputs + AI responses |
| **Supabase Clients** | [supabase.server.ts](file:///c:/Users/medya/projects/AIESEC-Hackathon/potential-hire/src/lib/db/supabase.server.ts), [supabase.browser.ts](file:///c:/Users/medya/projects/AIESEC-Hackathon/potential-hire/src/lib/db/supabase.browser.ts) |
| **Auth Middleware** | [middleware.ts](file:///c:/Users/medya/projects/AIESEC-Hackathon/potential-hire/src/middleware.ts) — route protection + env-var guard |
| **Design System** | [globals.css](file:///c:/Users/medya/projects/AIESEC-Hackathon/potential-hire/src/app/globals.css) — OKLCH dark theme, glassmorphism, animations |

### Phase 2: Services Layer

| Service | Purpose |
|---------|---------|
| [candidate.service.ts](file:///c:/Users/medya/projects/AIESEC-Hackathon/potential-hire/src/lib/services/candidate.service.ts) | Profile CRUD, skill management, completeness calculation |
| [scoring.service.ts](file:///c:/Users/medya/projects/AIESEC-Hackathon/potential-hire/src/lib/services/scoring.service.ts) | Weighted Potential Score (8 sub-metrics: learning velocity, skill gap closure, assessment performance, project consistency, credential quality, roadmap progress, simulation, feedback) |
| [roadmap.service.ts](file:///c:/Users/medya/projects/AIESEC-Hackathon/potential-hire/src/lib/services/roadmap.service.ts) | AI roadmap generation, milestone tracking, completion calculation |
| [credential.service.ts](file:///c:/Users/medya/projects/AIESEC-Hackathon/potential-hire/src/lib/services/credential.service.ts) | Credential CRUD, automated URL verification |

### Phase 3: AI Layer

| Module | Purpose |
|--------|---------|
| [openrouter.client.ts](file:///c:/Users/medya/projects/AIESEC-Hackathon/potential-hire/src/lib/ai/openrouter.client.ts) | OpenRouter API client with exponential backoff retry + Zod schema validation |
| [resume-parser.ts](file:///c:/Users/medya/projects/AIESEC-Hackathon/potential-hire/src/lib/ai/resume-parser.ts) | Structured data extraction from resume text |
| [skill-extractor.ts](file:///c:/Users/medya/projects/AIESEC-Hackathon/potential-hire/src/lib/ai/skill-extractor.ts) | Skill normalization, categorization, and proficiency estimation |
| [assessment-generator.ts](file:///c:/Users/medya/projects/AIESEC-Hackathon/potential-hire/src/lib/ai/assessment-generator.ts) | AI quiz generation with difficulty levels |

### Phase 4: API Routes

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/auth/callback` | GET | OAuth/magic link session exchange |
| `/api/candidates/profile` | GET, PATCH | Profile + skills + completeness |
| `/api/scoring` | GET, POST | Score retrieval + recalculation |
| `/api/roadmap` | GET, POST | Active roadmap + generation |
| `/api/roadmap/milestone` | POST | Milestone completion |
| `/api/credentials` | GET, POST, DELETE | Credential management |
| `/api/assessments/generate` | POST | AI quiz generation |

### Phase 5: Candidate Pages

| Page | Route | Features |
|------|-------|----------|
| **Landing** | `/` | Hero, stats, how-it-works cards, features grid, employer CTA, footer |
| **Register** | `/register` | Role selector (Candidate/Employer/Institution), form validation, Google+GitHub OAuth |
| **Login** | `/login` | Email/password + OAuth, Suspense boundary for searchParams |
| **Reset Password** | `/reset-password` | Email-based password recovery |
| **Onboarding** | `/candidate/onboarding` | 3-step wizard: About You → Career Goals → Skills |
| **Dashboard** | `/candidate/dashboard` | Score ring, sub-score breakdown, hiring readiness, action cards |
| **Profile** | `/candidate/profile` | Edit headline, goals, salary, availability, portfolio links |
| **Roadmap** | `/candidate/roadmap` | AI generation form → interactive milestone timeline with completion |
| **Credentials** | `/candidate/credentials` | Add/verify/delete credentials with status badges |
| **Assessments** | `/candidate/assessments` | Skill picker → AI quiz → results review with explanations |
| **Marketplace** | `/candidate/marketplace` | Placeholder (Souhaib's scope) |
| **Settings** | `/candidate/settings` | Data export (JSON download), account deletion |

---

## Key Compatibility Fixes

| Issue | Fix |
|-------|-----|
| `Github` icon removed from lucide-react | Replaced with inline SVG |
| `asChild` prop removed in latest Radix/base-ui | Removed from `DialogTrigger` and `SheetTrigger` |
| `Select.onValueChange` returns `string \| null` | Added null guards (`v && setX(v)`) |
| `z.enum` `required_error` removed in Zod v4 | Changed to `message` parameter |
| `useSearchParams()` requires Suspense in Next.js 16 | Wrapped login page in `<Suspense>` |
| `middleware` convention deprecated in Next.js 16 | Warning only — still functional |
| Build fails without env vars | Added preview mode fallback in middleware + browser client |

---

## Verification

- ✅ TypeScript compiles with zero errors
- ✅ All pages render correctly at `localhost:3000`
- ✅ Sidebar navigation works across all candidate pages
- ✅ Landing page, auth pages, dashboard, roadmap, credentials, assessments all functional
- ⚠️ Production build requires `.env.local` with real Supabase credentials

---

## What Remains (Souhaib's Branch)

- Employer dashboard, candidate search, blind matching UI
- Marketplace internship CRUD and application flow
- Notification service (Resend integration)
- Payment integration (Stripe)
- Resume PDF upload pipeline
