import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

const roadmapResponseSchema = z.object({
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

let systemPrompt = "Generate a roadmap.";
const jsonSchema = zodToJsonSchema(roadmapResponseSchema, "ExpectedResponse");
systemPrompt += `\n\nCRITICAL INSTRUCTION: You MUST return ONLY a raw JSON object that strictly adheres to the following JSON schema. Do not include markdown formatting or explanations.\n\n${JSON.stringify(jsonSchema, null, 2)}`;

console.log(systemPrompt);
