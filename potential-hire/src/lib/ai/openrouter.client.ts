import { z, type ZodSchema } from "zod";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

interface AICompleteParams<T> {
  model: string;
  systemPrompt: string;
  userPrompt: string;
  responseSchema: ZodSchema<T>;
  temperature?: number;
  maxRetries?: number;
}

export async function aiComplete<T>(params: AICompleteParams<T>): Promise<T> {
  const {
    model,
    systemPrompt,
    userPrompt,
    responseSchema,
    temperature = 0.3,
    maxRetries = 3,
  } = params;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
          "X-Title": "PotentialHire",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature,
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `OpenRouter API error (${response.status}): ${errorBody}`
        );
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error("No content in OpenRouter response");
      }

      const parsed = JSON.parse(content);
      return responseSchema.parse(parsed);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(
        `[OpenRouter] Attempt ${attempt + 1}/${maxRetries} failed:`,
        lastError.message
      );

      if (attempt < maxRetries - 1) {
        // Exponential backoff: 1s, 2s, 4s
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }
  }

  throw new Error(
    `OpenRouter failed after ${maxRetries} attempts: ${lastError?.message}`
  );
}

// Preset model constants
export const MODELS = {
  GPT4O: "openai/gpt-4o",
  GPT4O_MINI: "openai/gpt-4o-mini",
  CLAUDE_SONNET: "anthropic/claude-sonnet-4-20250514",
  LLAMA_70B: "meta-llama/llama-3.1-70b-instruct",
} as const;
