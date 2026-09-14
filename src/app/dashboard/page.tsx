import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getBranchStats } from "@/lib/dashboard-stats";
import { signOut } from "@/app/login/actions";
import { Button, buttonVariants } from "@/components/ui/button";

export default async function DashboardPage() {
  const user = await requireUser();
  const supabase = await createClient();

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Welcome, {user.name}</h1>
          <p className="text-sm text-muted-foreground capitalize">Role: {user.role}</p>
        </div>
        <div className="flex items-center gap-3">
          {user.role === "admin" && (
            <Link href="/admin/staff" className={buttonVariants({ variant: "outline" })}>
              Manage staff accounts
            </Link>
          )}
          <form action={signOut}>
            <Button type="submit" variant="outline">
              Sign out
            </Button>
          </form>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/clients" className={buttonVariants({ variant: "outline" })}>
          Clients
        </Link>
        <Link href="/files" className={buttonVariants({ variant: "outline" })}>
          Files
        </Link>
        <Link href="/bring-ups" className={buttonVariants({ variant: "outline" })}>
          Bring-ups
        </Link>
        <Link href="/calendar" className={buttonVariants({ variant: "outline" })}>
          Calendar
        </Link>
      </div>

      {user.role === "admin" ? (
        <AdminOverview supabase={supabase} />
      ) : (
        <StaffOverview supabase={supabase} branchIds={user.branchIds} />
      )}
    </div>
  );
}

async function AdminOverview({
  supabase,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
}) {
  const { data: branches } = await supabase.from("branches").select("id, name").order("name");

  const branchesWithStats = await Promise.all(
    (branches ?? []).map(async (branch) => ({
      ...branch,
      stats: await getBranchStats(supabase, [branch.id]),
    }))
  );

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">Branches</h2>
      {branchesWithStats.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No branches exist yet. Create one directly in Supabase.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {branchesWithStats.map((branch) => (
          <Link
            key={branch.id}
            href={`/branches/${branch.id}`}
            className="rounded-lg border p-4 transition-colors hover:bg-muted/50"
          >
            <p className="font-medium">{branch.name}</p>
            <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
              <div>
                <p className="text-lg font-semibold">{branch.stats.activeClients}</p>
                <p className="text-muted-foreground">Clients</p>
              </div>
              <div>
                <p className="text-lg font-semibold">{branch.stats.openFiles}</p>
                <p className="text-muted-foreground">Open files</p>
              </div>
              <div>
                <p className="text-lg font-semibold">{branch.stats.bringUpsDueThisWeek}</p>
                <p className="text-muted-foreground">Due this week</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

async function StaffOverview({
  supabase,
  branchIds,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  branchIds: string[];
}) {
  const stats = await getBranchStats(supabase, branchIds);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">Your branch overview</h2>
      {branchIds.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          You are not assigned to any branch yet. Ask an admin to assign you to one.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border p-4">
            <p className="text-2xl font-semibold">{stats.openFiles}</p>
            <p className="text-sm text-muted-foreground">Open files</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-2xl font-semibold">{stats.bringUpsDueThisWeek}</p>
            <p className="text-sm text-muted-foreground">Bring-ups due this week</p>
          </div>
        </div>
      )}
    </div>
  );
}
