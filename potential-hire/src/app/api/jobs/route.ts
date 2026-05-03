import { NextResponse } from "next/server";
import { createClient } from "@/lib/db/supabase.server";
import { jobService } from "@/lib/services/job.service";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const jobs = await jobService.listActiveJobs();
    return NextResponse.json({ jobs });
  } catch (error) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
