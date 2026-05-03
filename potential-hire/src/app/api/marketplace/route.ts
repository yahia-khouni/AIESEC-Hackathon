import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/supabase.server";
import { marketplaceService } from "@/lib/services/marketplace.service";
import { employerService } from "@/lib/services/employer.service";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(100, "Description must be at least 100 characters"),
  category: z.enum(["data_analysis", "ui_design", "content", "dev", "research", "marketing", "other"]),
  duration_weeks: z.number().min(2).max(4),
  is_paid: z.boolean(),
  compensation: z.number().optional(),
  is_remote: z.boolean(),
  max_applicants: z.number().min(1).max(100),
  skills_required: z.array(z.string()).default([]),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const forEmployer = searchParams.get("employer") === "true";

    if (forEmployer) {
      const employer = await employerService.getProfile(user.id);
      if (!employer) return NextResponse.json({ internships: [] });
      const internships = await marketplaceService.getByEmployer(employer.id);
      return NextResponse.json({ internships });
    }

    // Public: open internships for candidates
    const category = searchParams.get("category");
    const is_paid = searchParams.get("is_paid");
    const is_remote = searchParams.get("is_remote");

    const internships = await marketplaceService.listOpen({
      category: category as any ?? undefined,
      is_paid: is_paid !== null ? is_paid === "true" : undefined,
      is_remote: is_remote !== null ? is_remote === "true" : undefined,
    });
    return NextResponse.json({ internships });
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
    const internship = await marketplaceService.createInternship(employer.id, data);
    return NextResponse.json({ internship }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
