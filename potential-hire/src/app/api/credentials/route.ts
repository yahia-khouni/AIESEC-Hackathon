import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/db/supabase.server";
import { candidateService } from "@/lib/services/candidate.service";
import { credentialService } from "@/lib/services/credential.service";
import { addCredentialSchema } from "@/lib/validations/schemas";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await candidateService.getProfile(user.id);
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const credentials = await credentialService.getAll(profile.id);
    return NextResponse.json({ credentials });
  } catch (error) {
    console.error("[GET /api/credentials]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await candidateService.getProfile(user.id);
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = addCredentialSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const credential = await credentialService.add(profile.id, parsed.data);

    // Auto-verify in background
    credentialService.verify(credential.id).catch(console.error);

    return NextResponse.json({ credential }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/credentials]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const credentialId = searchParams.get("id");

    if (!credentialId) {
      return NextResponse.json({ error: "Credential ID required" }, { status: 400 });
    }

    await credentialService.delete(credentialId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/credentials]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
