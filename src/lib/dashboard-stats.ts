import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export type BranchStats = {
  activeClients: number;
  openFiles: number;
  bringUpsDueThisWeek: number;
};

const EMPTY_STATS: BranchStats = { activeClients: 0, openFiles: 0, bringUpsDueThisWeek: 0 };

/** Counts behind the dashboard cards: active clients and open files per PRD
 * section 4.1 (admin branch cards) and bring-ups due within the next 7 days
 * per section 5.1 (the "due this week" indicator). `branchIds` may contain
 * one branch (a single-branch staff view) or several (an admin card, or a
 * multi-branch staff member's merged view). */
export async function getBranchStats(
  supabase: SupabaseClient,
  branchIds: string[]
): Promise<BranchStats> {
  if (branchIds.length === 0) return EMPTY_STATS;

  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [{ count: activeClients }, { count: openFiles }, { data: branchFiles }] =
    await Promise.all([
      supabase
        .from("clients")
        .select("*", { count: "exact", head: true })
        .in("branch_id", branchIds),
      supabase
        .from("files")
        .select("*", { count: "exact", head: true })
        .in("branch_id", branchIds)
        .eq("status", "open"),
      supabase.from("files").select("id").in("branch_id", branchIds),
    ]);

  const fileIds = (branchFiles ?? []).map((f) => f.id as string);

  let bringUpsDueThisWeek = 0;
  if (fileIds.length > 0) {
    const { count } = await supabase
      .from("bring_ups")
      .select("*", { count: "exact", head: true })
      .in("file_id", fileIds)
      .eq("status", "upcoming")
      .gte("due_date", now.toISOString())
      .lte("due_date", weekFromNow.toISOString());
    bringUpsDueThisWeek = count ?? 0;
  }

  return {
    activeClients: activeClients ?? 0,
    openFiles: openFiles ?? 0,
    bringUpsDueThisWeek,
  };
}
