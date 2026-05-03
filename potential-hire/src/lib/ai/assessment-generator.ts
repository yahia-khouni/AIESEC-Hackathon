import { aiComplete } from "@/lib/ai/openrouter.client";
import { quizQuestionSchema } from "@/lib/validations/schemas";
import type { QuizQuestion } from "@/lib/validations/schemas";

export async function generateQuiz(
  skillName: string,
  difficulty: "beginner" | "intermediate" | "advanced" = "intermediate",
  count: number = 10
): Promise<QuizQuestion[]> {
  const result = await aiComplete({
    systemPrompt: `You are a technical assessment AI. Generate multiple-choice quiz questions to test knowledge of a specific skill.

Rules:
- Each question has exactly 4 options
- Only 1 correct answer per question
- Include a brief explanation for the correct answer
- Questions should match the specified difficulty level
- Questions should be practical and test real understanding, not trivia
- Vary the question types: conceptual, practical, debugging, best practices

CRITICAL INSTRUCTION: You MUST return ONLY a raw JSON object EXACTLY matching this schema. Do not include markdown formatting like \`\`\`json. Return only the raw JSON.
{
  "questions": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correct_index": 0, // number from 0 to 3
      "explanation": "string"
    }
  ]
}`,
    userPrompt: `Skill: ${skillName}
Difficulty: ${difficulty}
Number of questions: ${count}

Generate the quiz questions.`,
    responseSchema: quizQuestionSchema,
    temperature: 0.5,
  });

  return result.questions;
}
