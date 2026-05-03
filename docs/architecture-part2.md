# PotentialHire — Architecture Part 2

> Sections 5–10: AI Scoring, Matching, Roadmap, Marketplace, Partnerships, Revenue

---

## 5. AI Potential Score Design

### Philosophy

The Potential Score answers: **"How likely is this candidate to succeed in their target role within 6–12 months?"** It is transparent, explainable, and auditable. Every candidate sees exactly what drives their score.

### Scoring Formula

```
PotentialScore = Σ (weight_i × normalized_subscore_i) × fairness_adjustment
```

### Weighted Components

| Sub-Score | Weight | Description | Data Source |
|---|---|---|---|
| **Learning Velocity** | 20% | Rate of skill acquisition over time | Credential timestamps, assessment dates |
| **Skill Gap Closure** | 18% | % of target role skills acquired vs. remaining | Roadmap progress, skill inventory |
| **Assessment Performance** | 15% | Scores on quizzes, projects, simulations | Internal + external assessments |
| **Project Consistency** | 12% | Regular output cadence (not just one burst) | Internship completions, portfolio updates |
| **Credential Quality** | 10% | Rigor and relevance of completed courses | Provider tier, course difficulty, verification status |
| **Roadmap Completion** | 10% | % of AI-generated roadmap milestones completed | Roadmap service |
| **Simulation Performance** | 8% | Real work task performance (micro-internships) | Employer ratings from marketplace |
| **Employer Feedback** | 7% | Ratings and reviews from past work | Internship reviews, reference scores |

**Total: 100%**

### Normalization

Each sub-score is normalized to 0–100 using percentile ranking within cohort (same target role + experience level):

```
normalized_score = (raw_value - cohort_min) / (cohort_max - cohort_min) × 100
```

For new cohorts with <30 members, use global benchmarks.

### Fairness Controls & Anti-Bias Logic

| Control | Implementation |
|---|---|
| **No demographic inputs** | Score never uses name, age, gender, ethnicity, nationality, photo |
| **Cohort-relative scoring** | Scores compared within same target role, not across all candidates |
| **Credential source balancing** | Free credentials (freeCodeCamp) and paid (Coursera) weighted equally by rigor, not price |
| **Geographic neutrality** | Internet speed / access disparities compensated via timezone-adjusted velocity |
| **Audit log** | Every score computation logged with inputs, weights, and output for regulatory review |
| **Disparate impact testing** | Monthly automated check: if any demographic group's average score deviates >15% from mean, flag for review |
| **Human override** | Admin can flag scores for manual review; candidates can dispute |
| **Version tracking** | `model_version` column tracks algorithm changes; old scores recomputable |

### Score Display (Candidate Dashboard)

```
Overall Potential Score: 73/100 ████████████████████░░░░░░░  (73%)

Sub-Scores:
├─ Learning Velocity    ████████████████████████░░  85/100
├─ Skill Gap Closure    ██████████████████░░░░░░░░  68/100
├─ Assessment Scores    ████████████████████░░░░░░  78/100
├─ Project Consistency  ███████████████░░░░░░░░░░░  55/100
├─ Credential Quality   ██████████████████████░░░░  80/100
├─ Roadmap Progress     ████████████████░░░░░░░░░░  62/100
├─ Work Simulation      ██████████████████████████  92/100
└─ Employer Feedback    ████████████████████░░░░░░  75/100

↑ Score increased +8 pts in last 30 days
```

### Recalculation Schedule

| Trigger | Action |
|---|---|
| Credential added | Recalculate within 5 minutes (Inngest event) |
| Assessment completed | Immediate recalculation |
| Internship rated | Recalculate within 5 minutes |
| Weekly cron | Full recalculation for all active candidates |
| Roadmap milestone hit | Recalculate within 5 minutes |

---

## 6. Matching Engine Design

### Matching Flow

```
Employer Search Request
        │
        ▼
┌──────────────────┐
│  Filter Layer    │  Hard filters: region, language, availability, min score
│  (PostgreSQL)    │
└────────┬─────────┘
         │ Filtered candidate set
         ▼
┌──────────────────┐
│  Semantic Layer  │  pgvector cosine similarity: job embedding ↔ candidate embedding
│  (pgvector)      │
└────────┬─────────┘
         │ Top-N semantically similar
         ▼
┌──────────────────┐
│  Scoring Layer   │  Weighted multi-factor ranking
│  (Application)   │
└────────┬─────────┘
         │ Final ranked results
         ▼
┌──────────────────┐
│  Blind Layer     │  Strip PII for first-round viewing
│  (Application)   │
└────────┬─────────┘
         ▼
    Employer sees ranked anonymous candidates
```

### Multi-Factor Match Score

```
MatchScore = (0.30 × role_fit)
           + (0.20 × growth_trajectory)
           + (0.15 × availability_match)
           + (0.15 × region_fit)
           + (0.10 × salary_fit)
           + (0.10 × language_fit)
```

| Factor | Calculation |
|---|---|
| **Role Fit** | Cosine similarity between job embedding and candidate profile embedding (pgvector) |
| **Growth Trajectory** | Slope of potential score over last 90 days (positive trend = bonus) |
| **Availability Match** | Binary + decay: immediate = 1.0, 1 month = 0.9, 3 months = 0.7, 6 months = 0.5 |
| **Region Fit** | Exact country match = 1.0, same continent = 0.7, remote-OK = 0.9 |
| **Salary Fit** | 1.0 if candidate range overlaps employer budget, linear decay outside |
| **Language Fit** | 1.0 if all required languages met, 0.5 per missing language penalty |

### Blind Hiring Implementation

**First Round (Blind):**

| Visible | Hidden |
|---|---|
| Potential Score + sub-scores | Name |
| Skill trajectory graph | Photo |
| Verified credentials list | Age |
| Assessment results | Gender |
| Portfolio (anonymized) | University name (optional) |
| Availability | Exact location (shows region only) |

**Second Round (Revealed):** After employer expresses interest and candidate opts in, full profile revealed.

### Talent Futures Pipeline

```typescript
// Employer sets readiness alert
await supabase.from('bookmarks').insert({
  employer_id: employer.id,
  candidate_id: candidate.id,
  readiness_threshold: 80, // Alert when score reaches 80
});

// Inngest cron job checks weekly
inngest.createFunction(
  { id: "check-readiness-alerts" },
  { cron: "0 9 * * 1" }, // Every Monday 9 AM
  async ({ step }) => {
    const bookmarks = await step.run("fetch-bookmarks", () =>
      supabase.from('bookmarks')
        .select('*, candidates(potential_score, user_id)')
        .eq('notified', false)
    );
    
    for (const bookmark of bookmarks.data) {
      if (bookmark.candidates.potential_score >= bookmark.readiness_threshold) {
        await step.run(`notify-${bookmark.id}`, () =>
          notificationService.send({
            userId: bookmark.employer_id,
            type: 'readiness_alert',
            title: `A bookmarked candidate reached score ${bookmark.readiness_threshold}!`,
          })
        );
      }
    }
  }
);
```

---

## 7. Roadmap Engine Design

### Generation Process

```
Candidate Profile
    ├── Current skills + proficiency levels
    ├── Target role
    ├── Target region
    ├── Timeline preference
    └── Learning style preference
            │
            ▼
    ┌───────────────────┐
    │  Context Builder  │  Fetches market data:
    │                   │  - Job postings for target role in region
    │                   │  - Most-demanded skills (last 90 days)
    │                   │  - Salary data
    │                   │  - Credential recognition rates
    └────────┬──────────┘
             │
             ▼
    ┌───────────────────┐
    │  OpenRouter LLM   │  Structured output prompt:
    │  (Claude 3.5)     │  "Generate a phased learning roadmap..."
    └────────┬──────────┘
             │
             ▼
    ┌───────────────────┐
    │  Validation       │  Zod schema validation
    │  + Storage        │  Store in roadmaps table
    └───────────────────┘
```

### Roadmap Structure (JSON)

```json
{
  "target_role": "Frontend Developer",
  "estimated_duration_weeks": 24,
  "phases": [
    {
      "title": "Foundation",
      "duration_weeks": 6,
      "milestones": [
        {
          "title": "HTML & CSS Mastery",
          "description": "Build 3 responsive landing pages",
          "skills": ["html", "css", "responsive-design"],
          "resources": [
            {"type": "course", "provider": "freecodecamp", "url": "...", "free": true},
            {"type": "project", "description": "Clone a landing page"}
          ],
          "assessment": {"type": "project_submission", "criteria": "..."},
          "completed": false
        }
      ]
    },
    {
      "title": "Core Skills",
      "duration_weeks": 8,
      "milestones": ["..."]
    },
    {
      "title": "Advanced + Portfolio",
      "duration_weeks": 10,
      "milestones": ["..."]
    }
  ]
}
```

### Dynamic Adaptation Triggers

| Trigger | Adaptation |
|---|---|
| **Candidate completes milestone early** | Accelerate timeline, suggest advanced resources |
| **Candidate fails assessment** | Insert remedial milestone, provide alternative resources |
| **Market trend shift** | New skill appears in >20% of target role postings → inject into roadmap |
| **Company demand spike** | Specific employer seeking skill X → prioritize X in roadmap |
| **Candidate stalls >2 weeks** | Send nudge notification, suggest smaller micro-goals |
| **New credential available** | Relevant new course released → suggest as resource option |

### Adaptation Implementation

```typescript
// Inngest event-driven adaptation
inngest.createFunction(
  { id: "adapt-roadmap" },
  { event: "roadmap/adaptation-needed" },
  async ({ event, step }) => {
    const { candidateId, trigger } = event.data;
    
    const [candidate, roadmap, marketData] = await step.run("fetch-context", () =>
      Promise.all([
        candidateService.getWithSkills(candidateId),
        roadmapService.getActive(candidateId),
        marketService.getTrends(candidate.target_role, candidate.target_region),
      ])
    );

    const adaptedRoadmap = await step.run("ai-adapt", () =>
      aiComplete({
        model: "anthropic/claude-3.5-sonnet",
        systemPrompt: ROADMAP_ADAPTATION_PROMPT,
        userPrompt: JSON.stringify({ candidate, roadmap, marketData, trigger }),
        responseSchema: RoadmapSchema,
      })
    );

    await step.run("save", () =>
      roadmapService.update(roadmap.id, {
        phases: adaptedRoadmap.phases,
        last_adapted_at: new Date(),
      })
    );
  }
);
```

---

## 8. Marketplace System Design

### Micro-Internship Lifecycle

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  EMPLOYER    │    │  PLATFORM   │    │  CANDIDATE  │
│  Posts       │───>│  Validates  │───>│  Browses    │
│  project     │    │  + lists    │    │  + applies  │
└─────────────┘    └─────────────┘    └──────┬──────┘
                                             │
┌─────────────┐    ┌─────────────┐    ┌──────▼──────┐
│  EMPLOYER    │<───│  PLATFORM   │<───│  CANDIDATE  │
│  Reviews     │    │  Manages    │    │  Selected   │
│  applicants  │    │  workflow   │    │             │
└──────┬──────┘    └─────────────┘    └─────────────┘
       │
┌──────▼──────┐    ┌─────────────┐    ┌─────────────┐
│  EMPLOYER    │    │  PLATFORM   │    │  CANDIDATE  │
│  Selects     │───>│  Notifies   │───>│  Starts     │
│  candidate   │    │  + tracks   │    │  work       │
└─────────────┘    └─────────────┘    └──────┬──────┘
                                             │
┌─────────────┐    ┌─────────────┐    ┌──────▼──────┐
│  EMPLOYER    │<───│  PLATFORM   │<───│  CANDIDATE  │
│  Reviews     │    │  Stores     │    │  Submits    │
│  deliverable │    │  + verifies │    │  work       │
└──────┬──────┘    └─────────────┘    └─────────────┘
       │
┌──────▼──────┐    ┌─────────────┐
│  BOTH       │───>│  PLATFORM   │
│  Rate each  │    │  Updates    │
│  other      │    │  scores +   │
│             │    │  portfolio  │
└─────────────┘    └─────────────┘
```

### Project Posting Rules

| Rule | Enforcement |
|---|---|
| Duration: 2–4 weeks | Validation on post creation |
| Clear deliverables | AI checks description for specificity |
| Fair compensation (if paid) | Minimum per region, flagged if below |
| No full-time disguised | Max 20 hrs/week, AI content analysis |
| Skill-tagged | Required skill tags for matching |

### Quality Controls

| Concern | Mechanism |
|---|---|
| Spam projects | AI moderation on post content + employer reputation score |
| Fake completions | Employer must confirm receipt + rate deliverable |
| Exploitation | Candidate can flag; admin review pipeline |
| Rating manipulation | Mutual blind rating (both submit before either sees) |
| Dispute resolution | 3-step: auto-mediation → admin review → refund/override |

### Verified Work History

Upon completion and mutual positive rating:
1. Internship added to candidate's **verified experience** section
2. Skills used are marked as **work-verified** (highest trust level)
3. Employer review visible on profile (with consent)
4. Potential Score recalculated with new simulation + feedback data

---

## 9. Partnership Ecosystem Model

### 9.1 Universities

| Aspect | Detail |
|---|---|
| **Integration** | Bulk upload graduating cohorts via CSV or API |
| **Dashboard** | Real-time employability analytics: avg score, skill gaps, placement rate |
| **Value** | Benchmark students vs. market demand; improve curriculum alignment |
| **Reports** | Quarterly employability reports exportable to PDF |
| **Co-branding** | University-branded roadmaps for enrolled students |
| **Revenue** | Annual license fee per institution (tiered by student count) |
| **API** | Webhook notifications on student milestones; embed score widget in university portal |

### 9.2 Companies / Employers

| Aspect | Detail |
|---|---|
| **Access** | SaaS subscription for talent discovery dashboard |
| **Talent Futures** | Bookmark candidates 6–12 months before readiness → build future pipelines |
| **Blind Hiring** | First-round anonymous matching reduces bias liability |
| **Marketplace** | Post micro-internships for low-risk talent trials |
| **Analytics** | Hiring funnel metrics, cost-per-hire analysis, diversity reports |
| **Integration** | ATS webhook (Greenhouse, Lever, Workable) for candidate push |
| **Success Fee** | Optional performance-based fee (10–15% of first-year salary) after successful hire |

### 9.3 Startups

| Aspect | Detail |
|---|---|
| **Pricing** | Free tier + affordable startup plan ($49/mo) |
| **Marketplace Focus** | Post 2–4 week project missions instead of full job posts |
| **Value** | Access motivated junior talent at fraction of senior hire cost |
| **Hiring Path** | Internship → verified performance → full-time offer pipeline |

### 9.4 Learning Platforms (Coursera, Udemy, freeCodeCamp)

| Aspect | Detail |
|---|---|
| **Credential API** | OAuth-based completion sync; verify certificates automatically |
| **Co-branded Pathways** | "PotentialHire Recommended" course collections |
| **Affiliate Revenue** | Revenue share on course enrollments driven by roadmap recommendations |
| **Data Exchange** | Anonymized completion rates improve roadmap resource recommendations |
| **Integration** | Webhook on course completion → auto-update candidate credentials |

### 9.5 NGOs

| Aspect | Detail |
|---|---|
| **Programs** | Youth employment initiatives: cohort-based onboarding |
| **Tracking** | Employment outcome measurement dashboard |
| **Subsidy** | Platform access subsidized or free for NGO-sponsored candidates |
| **Reporting** | Impact reports for donor/grant compliance |
| **Co-design** | Custom roadmaps for underserved populations (adjusted for resource constraints) |

### 9.6 Governments

| Aspect | Detail |
|---|---|
| **National Programs** | Reskilling initiatives integrated with platform roadmaps |
| **Data** | Workforce readiness dashboards at city/region/national level |
| **Policy Input** | Anonymized skill gap data informs education policy |
| **Subsidies** | Government-funded employer incentives for hiring via platform |
| **Compliance** | Data residency, local privacy law adherence |

### 9.7 Recruiters / Agencies

| Aspect | Detail |
|---|---|
| **White-label** | Embed talent search in agency's own platform |
| **API Access** | Programmatic candidate search and shortlisting |
| **Revenue** | Agency subscription plan with higher candidate view limits |
| **Value** | Pre-scored candidates reduce screening time by 60%+ |

---

## 10. Revenue Model

### Revenue Streams

| Stream | Model | Phase 1 (MVP) | Phase 2 (Growth) | Phase 3 (Scale) |
|---|---|---|---|---|
| **Employer SaaS** | Monthly subscription | ✅ | ✅ | ✅ |
| **Success Fees** | % of first-year salary | — | ✅ | ✅ |
| **University Licenses** | Annual per-institution | — | ✅ | ✅ |
| **Marketplace Commission** | % of paid internship value | — | ✅ | ✅ |
| **Sponsored Campaigns** | Employer-promoted job posts | — | — | ✅ |
| **Analytics Subscriptions** | Advanced workforce analytics | — | — | ✅ |
| **Affiliate Revenue** | Learning platform referrals | ✅ | ✅ | ✅ |
| **Government Contracts** | National program licenses | — | — | ✅ |

### SaaS Pricing Tiers

| Plan | Price/mo | Candidate Views | Team Seats | Features |
|---|---|---|---|---|
| **Free Trial** | $0 (14 days) | 20 | 1 | Basic search, 1 job post |
| **Startup** | $49 | 100 | 3 | Blind hiring, bookmarks, 5 job posts |
| **Growth** | $199 | 500 | 10 | Talent futures, analytics, ATS integration, 20 job posts |
| **Enterprise** | Custom | Unlimited | Unlimited | Custom integrations, SLA, dedicated support, API access |

### Unit Economics Target (at Scale)

| Metric | Target |
|---|---|
| CAC (Employer) | < $200 |
| LTV (Employer) | > $3,000 |
| LTV:CAC | > 15:1 |
| Monthly churn | < 3% |
| Net Revenue Retention | > 120% |
