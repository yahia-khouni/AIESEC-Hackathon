import { z, type ZodSchema } from "zod";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

// ── Default model from environment ──────────────────────────────────────────
// Change OPENROUTER_MODEL in .env to swap models without touching code.
// Current best free model: deepseek/deepseek-r1:free
export const DEFAULT_MODEL =
  process.env.OPENROUTER_MODEL ?? "deepseek/deepseek-r1:free";

// ── Named model constants (for reference / explicit overrides) ────────────────
export const MODELS = {
  // Free tier — verified available on OpenRouter
  GEMINI_FLASH: "google/gemini-2.0-flash-exp:free",   // fast + JSON, recommended
  DEEPSEEK_V3: "deepseek/deepseek-chat:free",          // DeepSeek V3, strong reasoning
  LLAMA_70B: "meta-llama/llama-3.3-70b-instruct:free", // Meta Llama 3.3 70B

  // Paid tier (set OPENROUTER_MODEL to these if you upgrade)
  GPT4O: "openai/gpt-4o",
  GPT4O_MINI: "openai/gpt-4o-mini",
  CLAUDE_SONNET: "anthropic/claude-sonnet-4-20250514",
} as const;

interface AICompleteParams<T> {
  model?: string; // defaults to DEFAULT_MODEL (env var)
  systemPrompt: string;
  userPrompt: string;
  responseSchema: ZodSchema<T>;
  temperature?: number;
  maxRetries?: number;
}

export async function aiComplete<T>(params: AICompleteParams<T>): Promise<T> {
  const {
    model = DEFAULT_MODEL,
    systemPrompt,
    userPrompt,
    responseSchema,
    temperature = 0.3,
    maxRetries = 3,
  } = params;

  console.log(`[OpenRouter] Using model: ${model}`);

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
