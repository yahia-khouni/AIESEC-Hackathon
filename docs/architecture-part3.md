# PotentialHire — Architecture Part 3

> Sections 11–16: Security, Scaling, KPIs, Risks, Tech Stack, Final Verdict

---

## 11. Security & Compliance

### Data Protection (GDPR)

| Requirement | Implementation |
|---|---|
| **Lawful basis** | Consent at signup (granular toggles); legitimate interest for employers |
| **Right to access** | One-click data export (JSON/PDF) from settings |
| **Right to erasure** | Account deletion cascade: user → candidate → scores → credentials → files |
| **Data portability** | Standard JSON export of all personal data |
| **Data minimization** | Only collect what's needed; PII stripped from analytics |
| **Breach notification** | Automated detection → admin alert → 72-hour user notification pipeline |
| **DPO** | Designated Data Protection Officer contact in footer |

### Consent Management

```typescript
// Granular consent stored per user
interface ConsentPreferences {
  profile_visible_to_employers: boolean;  // Opt-in
  score_visible_publicly: boolean;        // Opt-in
  data_used_for_analytics: boolean;       // Opt-in
  receive_email_notifications: boolean;   // Opt-in, granular by type
  credential_auto_sync: boolean;          // Opt-in per provider
  blind_mode_participation: boolean;      // Default true
}
```

### Encryption

| Layer | Method |
|---|---|
| **In transit** | TLS 1.3 enforced (Vercel handles edge termination) |
| **At rest** | Supabase encrypts all data at rest (AES-256) |
| **Secrets** | Vercel encrypted environment variables, rotated quarterly |
| **PII fields** | Application-level encryption for sensitive fields (salary, demographics) using `@47ng/cloak` |
| **File storage** | Supabase Storage uses encrypted S3 buckets |

### Role-Based Access Control (RBAC)

| Role | Permissions |
|---|---|
| `candidate` | Own profile CRUD, view roadmap, take assessments, apply to internships |
| `employer` | Search candidates (blind), post jobs, post internships, manage pipeline |
| `institution` | View cohort analytics, upload students, generate reports |
| `admin` | Full access, moderation tools, user management, analytics |
| `support` | Read-only access to user data for issue resolution |

Implementation via Supabase RLS + Next.js middleware:

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const session = await getSession(request);
  const role = session?.user?.role;
  
  const protectedRoutes: Record<string, string[]> = {
    '/candidate': ['candidate'],
    '/employer': ['employer'],
    '/institution': ['institution'],
    '/admin': ['admin', 'support'],
  };
  
  const path = request.nextUrl.pathname;
  for (const [route, roles] of Object.entries(protectedRoutes)) {
    if (path.startsWith(route) && !roles.includes(role)) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }
}
```

### Audit Logging

| Event | Logged Data |
|---|---|
| Login / logout | User ID, timestamp, IP, device |
| Score computation | All inputs, weights, output, model version |
| Profile view by employer | Employer ID, candidate ID (anonymized), timestamp |
| Data export / deletion | User ID, timestamp, admin approver |
| Role changes | Who changed, from/to, timestamp |
| Internship disputes | Full timeline with evidence |

Stored in `audit_logs` table with 7-year retention policy.

### Anti-Fraud

| Threat | Countermeasure |
|---|---|
| Fake credentials | API verification with providers; manual review queue for unverifiable |
| Score manipulation | Server-side only computation; no client input to scoring |
| Fake accounts | Email verification + optional LinkedIn OAuth; IP rate limiting |
| Spam internships | AI content moderation + employer reputation score + manual review for new employers |
| Bot applications | Invisible CAPTCHA on apply flows; behavioral analysis |
| Data scraping | Rate limiting per API key; Vercel bot protection |

### AI Transparency

| Principle | Implementation |
|---|---|
| **Explainability** | Every score shows exact sub-score breakdown with weights |
| **Contestability** | Candidates can dispute score; triggers manual review |
| **No black box** | Scoring formula published in docs; no hidden factors |
| **Bias reporting** | Monthly disparate impact analysis; results published |
| **Model versioning** | Every score tagged with algorithm version; recomputable |

---

## 12. Scaling Plan

### Phase 1: MVP (0–1,000 users)

**Timeline:** Months 1–4

| Aspect | Approach |
|---|---|
| **Architecture** | Monolithic Next.js on Vercel + Supabase |
| **Team** | 2–3 full-stack developers |
| **Database** | Single Supabase project (free → Pro tier) |
| **AI** | OpenRouter API, no fine-tuning |
| **Features** | Profile, roadmap, basic scoring, employer search |
| **Infra cost** | ~$50–150/month |

```
[Vercel] ←→ [Supabase PostgreSQL]
   ↕              ↕
[OpenRouter]  [Supabase Storage]
   ↕
[Resend]
```

### Phase 2: Growth (1,000–100,000 users)

**Timeline:** Months 4–18

| Aspect | Approach |
|---|---|
| **Architecture** | Next.js + Inngest background jobs + Upstash Redis |
| **Team** | 5–8 engineers + 1 ML engineer |
| **Database** | Supabase Pro with read replicas; connection pooling via Supavisor |
| **AI** | Fine-tuned models for scoring; prompt caching; batch processing |
| **Features** | Marketplace, blind hiring, credential verification, university portal |
| **Search** | pgvector for semantic search; pg_trgm for full-text |
| **Infra cost** | ~$500–2,000/month |

Key additions:
- Redis caching layer (Upstash) for hot data (scores, search results)
- Background job system (Inngest) for async processing
- CDN for static assets (Vercel Edge Network)
- Sentry for error tracking, Axiom for logs

### Phase 3: Scale (100,000–10M users)

**Timeline:** Months 18–36+

| Aspect | Approach |
|---|---|
| **Architecture** | Microservices extraction for critical paths |
| **Team** | 15–30 engineers across squads |
| **Database** | Supabase Enterprise OR migrate to self-managed Postgres on AWS RDS with read replicas; separate analytics DB (ClickHouse) |
| **AI** | Self-hosted models for scoring (cost control); OpenRouter for generative features |
| **Features** | Government programs, white-label, advanced analytics, mobile apps |
| **Search** | Dedicated Elasticsearch cluster for talent search |
| **Infra cost** | ~$10,000–50,000/month |

Migration path:
1. Extract **Scoring Engine** into standalone service (highest compute)
2. Extract **Matching Service** into standalone service (needs dedicated scaling)
3. Move to **Kubernetes (EKS)** for extracted services
4. Keep Next.js frontend on Vercel
5. Add **Elasticsearch** for advanced talent search
6. Add **ClickHouse** for analytics warehouse
7. Implement **event-driven architecture** with message queue (AWS SQS or Redis Streams)

```
┌─────────┐     ┌─────────────┐     ┌──────────────┐
│ Vercel   │────>│ API Gateway │────>│ Scoring      │
│ Next.js  │     │ (Kong/AWS)  │     │ Service (K8s)│
└─────────┘     └──────┬──────┘     └──────────────┘
                       │
                       ├────────────>┌──────────────┐
                       │             │ Matching     │
                       │             │ Service (K8s)│
                       │             └──────────────┘
                       │
                       ├────────────>┌──────────────┐
                       │             │ Core API     │
                       │             │ Service (K8s)│
                       │             └──────────────┘
                       │
              ┌────────▼────────┐
              │   Message Queue │
              │   (SQS/Redis)   │
              └─────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
┌──────────┐   ┌────────────┐  ┌────────────┐
│PostgreSQL│   │Elasticsearch│  │ClickHouse  │
│(Primary) │   │(Search)     │  │(Analytics) │
└──────────┘   └────────────┘  └────────────┘
```

---

## 13. KPI Dashboard

### Core Metrics

| Category | Metric | Definition | Target (Year 1) |
|---|---|---|---|
| **Placement** | Placement Rate | % of active candidates hired within 12 months | > 15% |
| **Placement** | Time to Hire | Days from first employer view to offer | < 45 days |
| **Engagement** | Candidate Retention (30d) | % of candidates active after 30 days | > 60% |
| **Engagement** | Roadmap Completion Rate | % of roadmap milestones completed | > 40% |
| **Revenue** | Employer Renewal Rate | % of employers renewing subscription monthly | > 85% |
| **Marketplace** | Marketplace Conversion | % of internship applications → accepted | > 25% |
| **Growth** | Avg Score Improvement | Mean score increase per candidate per month | +3 pts/mo |
| **Growth** | Weekly Active Users | Unique users with meaningful action per week | Track growth |
| **Quality** | Employer NPS | Net Promoter Score from employer surveys | > 50 |
| **Quality** | Candidate NPS | Net Promoter Score from candidate surveys | > 40 |
| **Bias** | Score Fairness Index | Max demographic group deviation from mean | < 10% |
| **Revenue** | MRR | Monthly Recurring Revenue | Track growth |
| **Revenue** | ARPU (Employer) | Average Revenue Per Employer User | > $100/mo |

### Dashboard Implementation

Built as internal admin dashboard at `/admin/analytics` using:
- **Recharts** for visualization
- **Supabase views** for pre-aggregated metrics
- **Vercel Cron** for daily metric snapshots
- Export to CSV/PDF for stakeholder reports

---

## 14. Risks & Mitigations

| Risk | Severity | Probability | Mitigation |
|---|---|---|---|
| **Biased scoring** | 🔴 High | Medium | No demographic inputs; monthly disparate impact testing; public formula; candidate disputes |
| **Fake credentials** | 🔴 High | High | API verification with providers; AI document analysis; manual review queue |
| **Low employer trust** | 🟡 Medium | Medium | Free trial; case studies; blind hiring reduces risk; satisfaction guarantee |
| **Cold start problem** | 🟡 Medium | High | Seed with university partnerships; import public course data; synthetic demo profiles |
| **Spam internships** | 🟡 Medium | Medium | AI moderation; employer reputation score; new employer review queue; candidate reporting |
| **User churn** | 🟡 Medium | Medium | Gamification (streaks, badges); push notifications; weekly progress emails via Resend |
| **AI hallucination in roadmaps** | 🟡 Medium | Medium | Structured output with Zod validation; human-curated resource database; feedback loop |
| **Data breach** | 🔴 High | Low | Encryption at rest + transit; RLS; audit logs; incident response plan; Supabase SOC2 |
| **Competitor replication** | 🟡 Medium | Medium | Network effects + data moat + ecosystem lock-in = defensible; speed to market |
| **Regulatory changes** | 🟡 Medium | Low | GDPR-first design; consent management; modular compliance layer |
| **OpenRouter dependency** | 🟡 Medium | Low | Multi-model fallback; critical paths have rule-based fallbacks |
| **Cost of AI at scale** | 🟡 Medium | Medium | Prompt caching; batch processing; self-hosted models at Phase 3 |

---

## 15. Recommended Tech Stack

### Complete Stack Summary

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Framework** | Next.js (App Router) | 15.x | Full-stack React framework |
| **Language** | TypeScript | 5.x | Type safety |
| **Styling** | Tailwind CSS | 4.x | Utility-first CSS |
| **UI Components** | shadcn/ui | Latest | Accessible component library |
| **State Management** | Zustand | 5.x | Lightweight client state |
| **Forms** | React Hook Form + Zod | Latest | Validated forms |
| **Charts** | Recharts | 2.x | Data visualization |
| **Database** | Supabase PostgreSQL | Latest | Primary data store |
| **Auth** | Supabase Auth | Latest | Authentication + OAuth |
| **Storage** | Supabase Storage | Latest | File storage (S3-compatible) |
| **Realtime** | Supabase Realtime | Latest | Live subscriptions |
| **Vector Search** | pgvector (via Supabase) | Latest | Embedding similarity |
| **Cache** | Upstash Redis | Latest | Serverless Redis |
| **AI** | OpenRouter API | Latest | Multi-model LLM gateway |
| **Background Jobs** | Inngest | Latest | Event-driven serverless functions |
| **Email** | Resend + React Email | Latest | Transactional email |
| **Deployment** | Vercel | Latest | Hosting + edge + CDN |
| **CI/CD** | GitHub Actions | Latest | Automated testing + deploy |
| **Monitoring** | Sentry | Latest | Error tracking |
| **Logging** | Axiom | Latest | Log aggregation |
| **Testing** | Vitest + Playwright | Latest | Unit + E2E testing |
| **Package Manager** | pnpm | 9.x | Fast, disk-efficient |
| **Linting** | ESLint + Prettier | Latest | Code quality |
| **ORM** | Drizzle ORM | Latest | Type-safe SQL queries |

### Why This Stack

1. **Vercel + Next.js** — Zero-config deployment, edge functions, preview environments, native RSC support
2. **Supabase** — Eliminates 5+ separate services (DB, Auth, Storage, Realtime, Vector) into one platform
3. **OpenRouter** — Model-agnostic AI layer; switch between GPT-4o, Claude, Llama without code changes
4. **Inngest** — Background jobs without managing queues or workers; built for serverless
5. **Resend** — Developer-first email with React Email templates; 3,000 free emails/month
6. **Drizzle ORM** — SQL-like syntax with full type safety; lightweight; works great with Supabase
7. **pnpm** — 2–3x faster installs than npm; strict dependency resolution

---

## 16. Final Verdict

### Why PotentialHire Can Become a Global Category-Defining Startup

**1. Massive Market, Zero Incumbents in This Niche**

The global recruitment market is $600B+. LinkedIn, Indeed, and Glassdoor serve experienced professionals. No platform has built a credible **potential-first hiring engine** for the 200M+ students and fresh graduates entering the workforce annually. This is greenfield.

**2. Compounding Data Moat**

Every candidate interaction — courses completed, assessments passed, internships rated, scores improved — creates proprietary longitudinal data. After 12–24 months, the platform's predictive accuracy for "who will succeed?" becomes nearly impossible to replicate. This data flywheel is the ultimate defensibility.

**3. Multi-Sided Network Effects**

- More candidates → more employer interest
- More employers → more internship opportunities → more candidates
- More universities → more students → larger candidate pool → more employer value
- More credential providers integrated → better roadmaps → better scores → more trust

Each node strengthens every other node. The 4th entrant has 1/10th the value of the 1st.

**4. Mission-Aligned with Global Trends**

- Skills-based hiring is replacing degree-based hiring (Harvard, Google, Apple dropped degree requirements)
- AI-augmented recruitment is inevitable
- DEI initiatives demand bias-free assessment tools
- Emerging market talent pools are 10x underserved

**5. Capital-Efficient Architecture**

Phase 1 ships on <$200/month infrastructure. The Vercel + Supabase + OpenRouter stack means a team of 3 can build an MVP that serves 1,000 users without DevOps overhead. This is a strong seed-stage pitch: low burn, fast iteration, clear path to revenue.

**6. Multiple Revenue Vectors**

SaaS subscriptions provide predictable ARR. Success fees create upside on outcomes. Marketplace commissions capture transactional value. University licenses open institutional sales. Government contracts enable national-scale partnerships. No single revenue dependency.

**7. Global by Default**

The platform is inherently cross-border. A candidate in Lagos can be matched with an employer in Berlin. A university in São Paulo can benchmark against market demand in Singapore. This isn't localization — it's native globalization.

### The Verdict

> **PotentialHire sits at the intersection of three megatrends: the skills revolution, AI-augmented hiring, and the global talent democratization movement. The technical architecture is designed for a team of 3 to ship in 3 months and scale to millions without re-architecture. The data moat compounds with every user interaction. The multi-sided network effects create winner-take-most dynamics. This is not a feature — it is a category.**

---

*Document generated for AIESEC Hackathon 2026 · PotentialHire Architecture v1.0*
