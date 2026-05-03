/**
 * Tests the create-profile API endpoint directly (bypasses trigger).
 * Run with: node scripts/test-trigger.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env
try {
  const envContent = readFileSync(resolve(process.cwd(), ".env"), "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...valueParts] = trimmed.split("=");
    if (key && valueParts.length > 0) process.env[key.trim()] = valueParts.join("=").trim();
  }
} catch { /* no .env */ }

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !SERVICE_KEY) {
  console.error("❌ Missing env vars"); process.exit(1);
}

const admin = createClient(URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("  Profile Creation Test (App-Level Approach)");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

// ── 1. Create test auth user ──
const testEmail = `test-profile-${Date.now()}@potentialhire-test.dev`;
console.log("① Creating test auth user:", testEmail);

const { data: createData, error: createError } = await admin.auth.admin.createUser({
  email: testEmail,
  password: "TestPassword123!",
  email_confirm: true,
  user_metadata: { full_name: "Test User", role: "candidate" },
});

if (createError) {
  console.error("❌ Admin createUser failed:", createError.message);
  process.exit(1);
}

const userId = createData.user.id;
console.log("   ✅ Auth user created:", userId);

// ── 2. Test the create-profile API endpoint ──
console.log("\n② Testing create-profile API endpoint...");
console.log("   (Make sure npm run dev is running on port 3000)");

try {
  const res = await fetch("http://localhost:3000/api/auth/create-profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: userId,
      email: testEmail,
      full_name: "Test User",
      role: "candidate",
    }),
  });

  const json = await res.json();

  if (res.ok) {
    console.log("   ✅ API responded:", res.status, JSON.stringify(json));
  } else {
    console.error("   ❌ API failed:", res.status, JSON.stringify(json));
  }
} catch (err) {
  console.error("   ❌ Could not reach API — is npm run dev running?");
  console.error("   Error:", err.message);
}

// ── 3. Verify public.users row ──
await new Promise(r => setTimeout(r, 500));
console.log("\n③ Checking public.users row...");

const { data: row, error: rowErr } = await admin
  .from("users").select("*").eq("id", userId).single();

if (rowErr) {
  console.error("   ❌ Row not found:", rowErr.message);
  console.error("   → The create-profile API may have failed");
} else {
  console.log("   ✅ Row found!");
  console.log("   id:", row.id);
  console.log("   email:", row.email);
  console.log("   full_name:", row.full_name);
  console.log("   role:", row.role);
  console.log("\n✅ Registration will work now. Try creating an account!");
}

// ── 4. Also test direct service-role insert (to check RLS) ──
console.log("\n④ Testing direct service-role INSERT (RLS bypass check)...");
const testId2 = "00000000-0000-0000-0000-000000000001";
await admin.from("users").delete().eq("id", testId2); // clean up if exists

const { error: directInsertErr } = await admin.from("users").insert({
  id: testId2,
  email: "direct-test@test.dev",
  full_name: "Direct Test",
  role: "candidate",
});

if (directInsertErr) {
  console.error("   ❌ Direct service-role insert failed:", directInsertErr.message);
  console.error("   code:", directInsertErr.code);
  console.error("   → This means service_role does NOT have INSERT on public.users");
  console.error("   → Run the GRANT statements in supabase/fix-permissions.sql");
} else {
  console.log("   ✅ Direct service-role insert works — RLS is bypassed correctly");
  await admin.from("users").delete().eq("id", testId2);
}

// ── 5. Cleanup ──
console.log("\n⑤ Cleaning up...");
await admin.auth.admin.deleteUser(userId);
console.log("   ✅ Test user deleted");

console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
