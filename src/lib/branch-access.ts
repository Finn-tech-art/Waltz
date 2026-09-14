import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CurrentUser } from "@/lib/auth";

export type BranchOption = { id: string; name: string };

/** Branches a user is allowed to create/attribute records to: all of them for
 * admin, only their assigned ones for staff. */
export async function getSelectableBranches(
  supabase: SupabaseClient,
  user: CurrentUser
): Promise<BranchOption[]> {
  if (user.role === "admin") {
    const { data } = await supabase.from("branches").select("id, name").order("name");
    return data ?? [];
  }

  if (user.branchIds.length === 0) return [];

  const { data } = await supabase
    .from("branches")
    .select("id, name")
    .in("id", user.branchIds)
    .order("name");
  return data ?? [];
}

/** Staff (and any admin who also happens to have a branch assignment)
 * available to be picked as a file's responsible lawyer for a given branch. */
export async function getBranchStaff(
  supabase: SupabaseClient,
  branchId: string
): Promise<{ id: string; name: string }[]> {
  const { data } = await supabase
    .from("user_branches")
    .select("profiles(id, name)")
    .eq("branch_id", branchId)
    .returns<{ profiles: { id: string; name: string } | null }[]>();

  return (data ?? [])
    .map((row) => row.profiles)
    .filter((p): p is { id: string; name: string } => p !== null)
    .sort((a, b) => a.name.localeCompare(b.name));
}
