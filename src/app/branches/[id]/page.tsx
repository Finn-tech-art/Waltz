import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getBranchStats } from "@/lib/dashboard-stats";
import { buttonVariants } from "@/components/ui/button";

export default async function BranchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const { data: branch } = await supabase
    .from("branches")
    .select("id, name, location")
    .eq("id", id)
    .maybeSingle();

  if (!branch) notFound();

  const stats = await getBranchStats(supabase, [id]);

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">{branch.name}</h1>
        {branch.location && <p className="text-sm text-muted-foreground">{branch.location}</p>}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border p-4">
          <p className="text-2xl font-semibold">{stats.activeClients}</p>
          <p className="text-sm text-muted-foreground">Active clients</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-2xl font-semibold">{stats.openFiles}</p>
          <p className="text-sm text-muted-foreground">Open files</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-2xl font-semibold">{stats.bringUpsDueThisWeek}</p>
          <p className="text-sm text-muted-foreground">Bring-ups due this week</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href={`/clients?branch=${id}`} className={buttonVariants({ variant: "outline" })}>
          View clients
        </Link>
        <Link href={`/files?branch=${id}`} className={buttonVariants({ variant: "outline" })}>
          View files
        </Link>
        <Link href={`/bring-ups?branch=${id}`} className={buttonVariants({ variant: "outline" })}>
          View bring-ups
        </Link>
      </div>
    </div>
  );
}
