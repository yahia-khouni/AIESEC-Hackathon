import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/supabase.server";
import { employerService } from "@/lib/services/employer.service";
import { z } from "zod";

const schema = z.object({
  company_name: z.string().min(2),
  industry: z.string().min(2),
  company_size: z.enum(["startup", "sme", "enterprise"]),
  website: z.string().url().optional().nullable(),
  plan: z.enum(["free", "startup", "growth", "enterprise"]).default("free"),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if employer already exists
    const existing = await employerService.getProfile(user.id);
    if (existing) {
      // Just mark onboarding complete and redirect
      await supabase
        .from("users")
        .update({ onboarding_complete: true })
        .eq("id", user.id);
      return NextResponse.json({ employer: existing });
    }

    const body = await request.json();
    const parsed = schema.parse(body);

    const employer = await employerService.createEmployer(user.id, {
      company_name: parsed.company_name,
      industry: parsed.industry,
      company_size: parsed.company_size,
      website: parsed.website ?? undefined,
    });

    return NextResponse.json({ employer });
  } catch (error) {
    console.error("[POST /api/employers/onboarding]", error);
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
