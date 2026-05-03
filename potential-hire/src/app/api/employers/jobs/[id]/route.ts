import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/supabase.server";
import { jobService } from "@/lib/services/job.service";
import { employerService } from "@/lib/services/employer.service";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(20).optional(),
  required_skills: z.array(z.string()).optional(),
  min_potential_score: z.number().min(0).max(100).optional(),
  region: z.string().optional(),
  salary_min: z.number().optional(),
  salary_max: z.number().optional(),
  type: z.enum(["full_time", "part_time", "contract", "internship"]).optional(),
  blind_mode: z.boolean().optional(),
  status: z.enum(["draft", "active", "closed"]).optional(),
});

async function getAuthorizedEmployer(userId: string, jobId: string) {
  const employer = await employerService.getProfile(userId);
  if (!employer) return null;
  const job = await jobService.getById(jobId);
  if (!job || job.employer_id !== employer.id) return null;
  return { employer, job };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await getAuthorizedEmployer(user.id, id);
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ job: result.job });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const result = await getAuthorizedEmployer(user.id, id);
    if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await request.json();
    const data = updateSchema.parse(body);
    await jobService.update(id, data);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const result = await getAuthorizedEmployer(user.id, id);
    if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await jobService.close(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
