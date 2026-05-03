import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/supabase.server";
import { jobService } from "@/lib/services/job.service";
import { employerService } from "@/lib/services/employer.service";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(20),
  required_skills: z.array(z.string()).default([]),
  min_potential_score: z.number().min(0).max(100).default(0),
  region: z.string().default("Remote"),
  salary_min: z.number().optional(),
  salary_max: z.number().optional(),
  type: z.enum(["full_time", "part_time", "contract", "internship"]),
  blind_mode: z.boolean().default(true),
  status: z.enum(["draft", "active"]).default("draft"),
});

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const employer = await employerService.getProfile(user.id);
    if (!employer) return NextResponse.json({ error: "Employer not found" }, { status: 404 });

    const jobs = await jobService.getByEmployer(employer.id);
    return NextResponse.json({ jobs });
  } catch (error) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const employer = await employerService.getProfile(user.id);
    if (!employer) return NextResponse.json({ error: "Employer not found" }, { status: 404 });

    const body = await request.json();
    const data = createSchema.parse(body);
    const job = await jobService.create(employer.id, data);
    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
