import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/supabase.server";
import { bookmarkService } from "@/lib/services/bookmark.service";
import { employerService } from "@/lib/services/employer.service";
import { z } from "zod";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const employer = await employerService.getProfile(user.id);
    if (!employer) return NextResponse.json({ error: "Employer not found" }, { status: 404 });
    const bookmarks = await bookmarkService.getAll(employer.id);
    return NextResponse.json({ bookmarks });
  } catch (error) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

const addSchema = z.object({
  candidateId: z.string(),
  readinessThreshold: z.number().min(0).max(100).default(80),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const employer = await employerService.getProfile(user.id);
    if (!employer) return NextResponse.json({ error: "Employer not found" }, { status: 404 });
    const body = await request.json();
    const { candidateId, readinessThreshold, notes } = addSchema.parse(body);
    await bookmarkService.add(employer.id, candidateId, readinessThreshold, notes);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
