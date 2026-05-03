import { aiComplete, MODELS } from "@/lib/ai/openrouter.client";
import { parsedResumeSchema } from "@/lib/validations/schemas";
import type { ParsedResume } from "@/types";

export async function parseResume(resumeText: string): Promise<ParsedResume> {
  const result = await aiComplete({
    model: MODELS.GPT4O,
    systemPrompt: `You are a professional resume parser. Extract structured information from the provided resume text.

Extract:
- summary: A 2-3 sentence professional summary
- experience: Array of work experiences with title, company, duration, and description
- education: Array of education entries with degree, institution, year, and field
- skills: Array of skill names mentioned
- certifications: Array of certification/course names mentioned

If a section is not present in the resume, return an empty array for it.
Return valid JSON matching the exact schema.`,
    userPrompt: resumeText,
    responseSchema: parsedResumeSchema,
    temperature: 0.1,
  });

  return result;
}
