import { z } from "zod";

// ---- Auth Schemas ----

export const registerSchema = z.object({
  full_name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be under 100 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be under 72 characters"),
  role: z.enum(["candidate", "employer", "institution"], {
    required_error: "Please select a role",
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const resetPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// ---- Candidate Profile Schemas ----

export const candidateOnboardingStep1Schema = z.object({
  headline: z.string().max(200, "Headline must be under 200 characters").optional(),
  languages: z
    .array(
      z.object({
        language: z.string().min(1, "Language is required"),
        level: z.enum(["basic", "conversational", "fluent", "native"]),
      })
    )
    .min(1, "Please add at least one language"),
});

export const candidateOnboardingStep2Schema = z.object({
  career_goals: z
    .array(z.string())
    .min(1, "Please add at least one career goal"),
  target_regions: z
    .array(z.string())
    .min(1, "Please select at least one target region"),
  salary_min: z.number().min(0).optional(),
  salary_max: z.number().min(0).optional(),
  availability: z.enum(["immediate", "1_month", "3_months", "6_months"]),
});

export const candidateOnboardingStep3Schema = z.object({
  skills: z
    .array(
      z.object({
        skill_name: z.string(),
        proficiency: z.enum(["beginner", "intermediate", "advanced", "expert"]),
      })
    )
    .min(1, "Please add at least one skill"),
});

export const candidateProfileUpdateSchema = z.object({
  headline: z.string().max(200).optional(),
  career_goals: z.array(z.string()).optional(),
  target_regions: z.array(z.string()).optional(),
  salary_min: z.number().min(0).optional().nullable(),
  salary_max: z.number().min(0).optional().nullable(),
  languages: z
    .array(
      z.object({
        language: z.string(),
        level: z.enum(["basic", "conversational", "fluent", "native"]),
      })
    )
    .optional(),
  portfolio_links: z.array(z.string().url()).optional(),
  availability: z
    .enum(["immediate", "1_month", "3_months", "6_months"])
    .optional(),
  is_public: z.boolean().optional(),
});

export type CandidateProfileUpdateInput = z.infer<typeof candidateProfileUpdateSchema>;

// ---- Credential Schemas ----

export const addCredentialSchema = z.object({
  provider: z.enum([
    "coursera",
    "udemy",
    "freecodecamp",
    "university",
    "internal",
    "other",
  ]),
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(200, "Title must be under 200 characters"),
  credential_url: z.string().url("Please enter a valid URL"),
});

export type AddCredentialInput = z.infer<typeof addCredentialSchema>;

// ---- Roadmap Schemas ----

export const generateRoadmapSchema = z.object({
  target_role: z.string().min(2, "Target role is required"),
  timeline_weeks: z.number().min(4).max(52).default(24),
});

export type GenerateRoadmapInput = z.infer<typeof generateRoadmapSchema>;

// ---- AI Response Schemas ----

export const parsedResumeSchema = z.object({
  summary: z.string(),
  experience: z.array(
    z.object({
      title: z.string(),
      company: z.string(),
      duration: z.string(),
      description: z.string(),
    })
  ),
  education: z.array(
    z.object({
      degree: z.string(),
      institution: z.string(),
      year: z.string(),
      field: z.string(),
    })
  ),
  skills: z.array(z.string()),
  certifications: z.array(z.string()),
});

export const roadmapResponseSchema = z.object({
  target_role: z.string(),
  estimated_duration_weeks: z.number(),
  phases: z.array(
    z.object({
      title: z.string(),
      duration_weeks: z.number(),
      milestones: z.array(
        z.object({
          title: z.string(),
          description: z.string(),
          skills: z.array(z.string()),
          resources: z.array(
            z.object({
              type: z.enum(["course", "video", "article", "project", "book"]),
              title: z.string(),
              url: z.string(),
              provider: z.string(),
              free: z.boolean(),
            })
          ),
          assessment: z
            .object({
              type: z.enum(["quiz", "project_submission"]),
              criteria: z.string(),
            })
            .nullable(),
        })
      ),
    })
  ),
});

export const skillExtractionSchema = z.object({
  skills: z.array(
    z.object({
      name: z.string(),
      category: z.enum(["technical", "soft", "domain"]),
      proficiency: z.enum(["beginner", "intermediate", "advanced", "expert"]),
    })
  ),
});

export const quizQuestionSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string(),
      options: z.array(z.string()).length(4),
      correct_index: z.number().min(0).max(3),
      explanation: z.string(),
    })
  ),
});

export type QuizQuestion = z.infer<typeof quizQuestionSchema>["questions"][number];
