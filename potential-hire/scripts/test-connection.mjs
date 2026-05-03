/**
 * Supabase Connection Test Script
 * Run with: node scripts/test-connection.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// ── Load .env manually ──
function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), ".env");
    const envContent = readFileSync(envPath, "utf8");
    for (const line of envContent.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const [key, ...valueParts] = trimmed.split("=");
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join("=").trim();
      }
    }
    console.log("✅ Loaded .env file");
  } catch {
    console.warn("⚠️  No .env file found, using process.env");
  }
}

loadEnv();

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("  PotentialHire — Supabase Connection Test");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

// ── 1. Check env vars ──
console.log("① Checking environment variables...");
const envOk = {
  NEXT_PUBLIC_SUPABASE_URL: !!URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: !!ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: !!SERVICE_KEY,
};

for (const [key, present] of Object.entries(envOk)) {
  const val = process.env[key];
  const preview = val ? `${val.slice(0, 20)}...` : "❌ MISSING";
  console.log(`  ${present ? "✅" : "❌"} ${key}: ${preview}`);
}

if (!URL || !ANON_KEY) {
  console.error(
    "\n❌ FATAL: Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
  console.error(
    "   → Create a .env file in potential-hire/ with the correct values"
  );
  process.exit(1);
}

// ── 2. Test anon client connection ──
console.log("\n② Testing anon client connection...");
const anonClient = createClient(URL, ANON_KEY);

try {
  // Ping auth — simplest check
  const { error: pingError } = await anonClient.auth.getSession();
  if (pingError) {
    console.error("  ❌ Anon auth ping failed:", pingError.message);
  } else {
    console.log("  ✅ Anon client connected successfully");
  }
} catch (err) {
  console.error("  ❌ Anon client connection threw:", err.message);
  console.error(
    "     → Check that NEXT_PUBLIC_SUPABASE_URL is correct (should end in .supabase.co)"
  );
}

// ── 3. Test service role client (if key available) ──
if (SERVICE_KEY) {
  console.log("\n③ Testing service role client...");
  const serviceClient = createClient(URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    // Try listing users (requires service role)
    const { data, error } = await serviceClient.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    });
    if (error) {
      console.error("  ❌ Service role test failed:", error.message);
      if (error.message.includes("Invalid API key")) {
        console.error("     → SUPABASE_SERVICE_ROLE_KEY is wrong or expired");
      }
    } else {
      console.log(`  ✅ Service role works — found ${data.users.length} user(s) in auth`);
    }
  } catch (err) {
    console.error("  ❌ Service role client threw:", err.message);
  }
} else {
  console.log("\n③ Skipping service role test (SUPABASE_SERVICE_ROLE_KEY not set)");
}

// ── 4. Check if public.users table exists ──
console.log("\n④ Checking if schema was applied (public.users table)...");
const client = SERVICE_KEY
  ? createClient(URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
  : anonClient;

try {
  const { data, error } = await client.from("users").select("id").limit(1);
  if (error) {
    console.error("  ❌ Cannot query public.users:", error.message);
    console.error("     code:", error.code);
    if (error.code === "42P01") {
      console.error(
        "     → Table 'users' does not exist — did you run supabase/schema.sql in the SQL Editor?"
      );
    } else if (error.code === "PGRST301" || error.message.includes("JWT")) {
      console.error("     → JWT / API key is invalid");
    } else {
      console.error("     → Full error:", JSON.stringify(error, null, 2));
    }
  } else {
    console.log(`  ✅ public.users table exists (${data.length} row(s) visible)`);
  }
} catch (err) {
  console.error("  ❌ Threw querying public.users:", err.message);
}

// ── 5. Check trigger exists ──
console.log("\n⑤ Checking if auth trigger is installed...");
if (SERVICE_KEY) {
  const serviceClient = createClient(URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const { data, error } = await serviceClient.rpc("pg_catalog.pg_proc", {}).limit(0);
    // Actually use a raw SQL approach via RPC
    const { data: triggerData, error: triggerError } = await serviceClient
      .from("pg_catalog.pg_trigger")
      .select("tgname")
      .eq("tgname", "on_auth_user_created")
      .limit(1);

    if (triggerError) {
      // Try another approach
      console.log("  ⚠️  Cannot directly query pg_catalog from client");
      console.log("     → Check manually in Supabase Dashboard → Database → Triggers");
      console.log("     → Look for: on_auth_user_created on auth.users");
    } else if (triggerData && triggerData.length > 0) {
      console.log("  ✅ Trigger 'on_auth_user_created' exists");
    } else {
      console.warn("  ⚠️  Trigger not found via this method — check manually");
    }
  } catch {
    console.log("  ⚠️  Cannot verify trigger from client — check Dashboard manually");
  }
} else {
  console.log("  ⚠️  Skipping trigger check (needs service role key)");
}

// ── 6. Check other key tables ──
console.log("\n⑥ Checking other schema tables...");
const tables = ["candidates", "skills", "credentials", "roadmaps"];
for (const table of tables) {
  try {
    const { error } = await client.from(table).select("id").limit(1);
    if (error) {
      console.error(`  ❌ ${table}: ${error.message} (code: ${error.code})`);
    } else {
      console.log(`  ✅ ${table}`);
    }
  } catch (err) {
    console.error(`  ❌ ${table}: threw ${err.message}`);
  }
}

// ── Summary ──
console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("  Done! Fix any ❌ items above, then try registering again.");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
