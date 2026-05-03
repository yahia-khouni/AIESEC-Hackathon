import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/supabase.server";
import { marketplaceService } from "@/lib/services/marketplace.service";
import { z } from "zod";

const patchSchema = z.object({
  action: z.enum(["accept", "reject"]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  const { applicationId } = await params;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { action } = patchSchema.parse(body);

    if (action === "accept") {
      await marketplaceService.acceptApplicant(applicationId);
    } else {
      await marketplaceService.rejectApplicant(applicationId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
