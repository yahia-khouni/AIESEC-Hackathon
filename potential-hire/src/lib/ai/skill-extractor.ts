import { aiComplete } from "@/lib/ai/openrouter.client";
import { skillExtractionSchema } from "@/lib/validations/schemas";

export async function extractSkills(
  resumeText: string,
  profileSkills: string[] = []
): Promise<
  { name: string; category: "technical" | "soft" | "domain"; proficiency: "beginner" | "intermediate" | "advanced" | "expert" }[]
> {
  const result = await aiComplete({
    systemPrompt: `You are a skill extraction AI. Analyze the provided resume text and profile skills to extract a normalized list of skills with proficiency levels.

Rules:
- Normalize skill names (e.g., "JS" → "JavaScript", "React.js" → "React")
- Categorize each skill as "technical", "soft", or "domain"
- Estimate proficiency based on context clues (years mentioned, project complexity, role seniority)
- Include both explicitly stated skills and implied skills from experience
- Remove duplicates
- Maximum 30 skills

Return valid JSON.`,
    userPrompt: `Resume text:
${resumeText}

Additional profile skills: ${profileSkills.join(", ") || "None"}`,
    responseSchema: skillExtractionSchema,
    temperature: 0.2,
  });

  return result.skills;
}
