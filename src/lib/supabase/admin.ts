import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Uses the service role key, which bypasses Row Level Security entirely.
 * Only call this from trusted server-side code (server actions, route
 * handlers) that has already checked the caller is an admin. The
 * `server-only` import makes it a build error to accidentally import this
 * into any client component.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
