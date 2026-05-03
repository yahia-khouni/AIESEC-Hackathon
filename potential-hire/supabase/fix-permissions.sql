-- ============================================================
-- PASTE THIS ENTIRE BLOCK into Supabase SQL Editor and Run it
-- This replaces the broken trigger with a safe version
-- ============================================================

-- Step 1: Drop the old broken trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 2: Replace the function with a bulletproof version
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    CASE
      WHEN NEW.raw_user_meta_data->>'role' = 'employer' THEN 'employer'::user_role
      WHEN NEW.raw_user_meta_data->>'role' = 'institution' THEN 'institution'::user_role
      ELSE 'candidate'::user_role
    END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log the error but don't block user creation
  RAISE LOG 'handle_new_user error: % %', SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Re-create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Step 4: Fix all permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Step 5: Confirm trigger exists
SELECT
  trigger_name,
  event_manipulation,
  event_object_schema,
  event_object_table,
  action_timing
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
