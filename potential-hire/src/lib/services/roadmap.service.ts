import { aiComplete, DEFAULT_MODEL } from "@/lib/ai/openrouter.client";
import { roadmapResponseSchema } from "@/lib/validations/schemas";
import { createClient } from "@/lib/db/supabase.server";
import type { Roadmap, CandidateSkill } from "@/types";

export const roadmapService = {
  async generate(
    candidateId: string,
    targetRole: string,
    timelineWeeks: number = 24,
    currentSkills: { name: string; proficiency: string }[] = []
  ): Promise<Roadmap> {
    const supabase = await createClient();

    // Deactivate any existing active roadmap
    await supabase
      .from("roadmaps")
      .update({ status: "paused" })
      .eq("candidate_id", candidateId)
      .eq("status", "active");

    // Generate roadmap via AI
    const skillsDescription = currentSkills.length > 0
      ? currentSkills.map((s) => `${s.name} (${s.proficiency})`).join(", ")
      : "No skills listed yet";

    const roadmapData = await aiComplete({
      systemPrompt: `You are an expert career development AI. Generate a detailed, phased learning roadmap for someone who wants to become a ${targetRole}.

The roadmap should:
- Be divided into 3-4 phases (Foundation, Core Skills, Advanced/Specialization, Portfolio/Job Prep)
- Each phase has concrete milestones with specific, actionable tasks
- Include FREE resources whenever possible (freeCodeCamp, YouTube, MDN, official docs)
- Include a mini-assessment for each milestone (quiz or project submission)
- Be realistic and achievable within the given timeline
- Account for the candidate's current skill level

CRITICAL INSTRUCTION: You MUST return ONLY a raw JSON object EXACTLY matching this schema. Do not include markdown formatting like \`\`\`json. Return only the raw JSON.
{
  "target_role": "string",
  "estimated_duration_weeks": 24,
  "phases": [
    {
      "title": "string",
      "duration_weeks": 6,
      "milestones": [
        {
          "title": "string",
          "description": "string",
          "skills": ["string"],
          "resources": [
            {
              "type": "course", // or "video", "article", "project", "book"
              "title": "string",
              "url": "string",
              "provider": "string",
              "free": true
            }
          ],
          "assessment": {
            "type": "quiz", // or "project_submission"
            "criteria": "string"
          }
        }
      ]
    }
  ]
}`,
      userPrompt: `Current skills: ${skillsDescription}
Target role: ${targetRole}
Timeline: ${timelineWeeks} weeks

Generate a comprehensive learning roadmap.`,
      responseSchema: roadmapResponseSchema,
      temperature: 0.4,
    });

    // Save to database
    const { data: roadmap, error } = await supabase
      .from("roadmaps")
      .insert({
        candidate_id: candidateId,
        target_role: targetRole,
        phases: roadmapData.phases.map((phase) => ({
          ...phase,
          milestones: phase.milestones.map((m) => ({
            ...m,
            completed: false,
            completed_at: null,
          })),
        })),
        completion_pct: 0,
        status: "active",
        generated_by_model: DEFAULT_MODEL,
      })
      .select()
      .single();

    if (error) throw error;
    return roadmap as Roadmap;
  },

  async getActive(candidateId: string): Promise<Roadmap | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("roadmaps")
      .select("*")
      .eq("candidate_id", candidateId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data as Roadmap | null;
  },

  async getAll(candidateId: string): Promise<Roadmap[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("roadmaps")
      .select("*")
      .eq("candidate_id", candidateId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []) as Roadmap[];
  },

  async completeMilestone(
    roadmapId: string,
    phaseIndex: number,
    milestoneIndex: number
  ): Promise<number> {
    const supabase = await createClient();

    // Fetch current roadmap
    const { data: roadmap, error: fetchError } = await supabase
      .from("roadmaps")
      .select("phases")
      .eq("id", roadmapId)
      .single();

    if (fetchError) throw fetchError;

    const phases = roadmap.phases as Roadmap["phases"];
    phases[phaseIndex].milestones[milestoneIndex].completed = true;
    phases[phaseIndex].milestones[milestoneIndex].completed_at =
      new Date().toISOString();

    // Calculate new completion percentage
    let totalMilestones = 0;
    let completedMilestones = 0;
    for (const phase of phases) {
      for (const milestone of phase.milestones) {
        totalMilestones++;
        if (milestone.completed) completedMilestones++;
      }
    }

    const completionPct =
      totalMilestones > 0
        ? Math.round((completedMilestones / totalMilestones) * 100)
        : 0;

    // Check if roadmap is fully completed
    const isComplete = completionPct === 100;

    // Update roadmap
    const { error: updateError } = await supabase
      .from("roadmaps")
      .update({
        phases,
        completion_pct: completionPct,
        status: isComplete ? "completed" : "active",
        last_adapted_at: new Date().toISOString(),
      })
      .eq("id", roadmapId);

    if (updateError) throw updateError;

    return completionPct;
  },
};
