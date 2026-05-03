import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/supabase.server";
import { marketplaceService } from "@/lib/services/marketplace.service";
import { z } from "zod";

const rateSchema = z.object({
  applicationId: z.string(),
  rating: z.number().min(1).max(5),
  review: z.string().optional(),
  raterType: z.enum(["employer", "candidate"]),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: internshipId } = await params;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { applicationId, rating, review, raterType } = rateSchema.parse(body);

    if (raterType === "employer") {
      await marketplaceService.rateCandidate(applicationId, rating, review ?? "");
    } else {
      await marketplaceService.rateEmployer(applicationId, rating);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
