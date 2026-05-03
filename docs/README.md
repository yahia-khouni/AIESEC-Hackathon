# PotentialHire — Full System Architecture

> **AI-Powered Employment Platform: Hiring by Future Potential, Not Past Credentials**
>
> Version 1.0 · May 2026 · Investor-Grade Technical Architecture

---

## 📑 Document Structure

This architecture is split into three parts for readability:

### [Part 1 — Foundation](./architecture-part1.md)
1. **Executive Summary** — Mission, problem, solution, defensibility
2. **Product Architecture Overview** — Module map, service interactions
3. **System Architecture** — Frontend, backend, AI layer, data layer, infrastructure
4. **Database Design** — All entities, relationships, RLS policies

### [Part 2 — Intelligence & Ecosystem](./architecture-part2.md)
5. **AI Potential Score Design** — Weighted formula, fairness controls, anti-bias logic
6. **Matching Engine Design** — Multi-factor matching, blind hiring, talent futures
7. **Roadmap Engine Design** — Dynamic adaptation, LLM generation, market responsiveness
8. **Marketplace System Design** — Micro-internship lifecycle, quality controls
9. **Partnership Ecosystem Model** — Universities, companies, NGOs, governments, recruiters
10. **Revenue Model** — SaaS tiers, success fees, unit economics

### [Part 3 — Operations & Strategy](./architecture-part3.md)
11. **Security & Compliance** — GDPR, encryption, RBAC, audit logs, AI transparency
12. **Scaling Plan** — MVP → Growth → Scale architecture evolution
13. **KPI Dashboard** — Core metrics and targets
14. **Risks & Mitigations** — 12 identified risks with countermeasures
15. **Recommended Tech Stack** — Complete technology table with rationale
16. **Final Verdict** — Why this becomes a category-defining startup

---

## 🏗️ Tech Stack at a Glance

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 · TypeScript · Tailwind CSS v4 · shadcn/ui |
| Backend | Next.js API Routes · Server Actions · Inngest |
| Database | Supabase PostgreSQL · pgvector · Upstash Redis |
| AI | OpenRouter API (GPT-4o, Claude, Llama) |
| Email | Resend + React Email |
| Deployment | Vercel |
| ORM | Drizzle ORM |
| Testing | Vitest + Playwright |

---

*Built for AIESEC Hackathon 2026*
