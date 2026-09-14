import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getSelectableBranches } from "@/lib/branch-access";
import { buttonVariants } from "@/components/ui/button";
import { markBringUpDone } from "@/app/files/actions";

type BringUpRow = {
  id: string;
  event_type: string;
  title: string;
  due_date: string;
  file_id: string | null;
  branch_id: string;
  branches: { name: string } | null;
  files: { file_number: string; clients: { name: string } | null } | null;
};

export default async function BringUpsPage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string }>;
}) {
  const user = await requireUser();
  const { branch } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("bring_ups")
    .select(
      "id, event_type, title, due_date, file_id, branch_id, branches(name), files(file_number, clients(name))"
    )
    .eq("status", "upcoming");

  if (user.role === "admin" && branch) {
    query = query.eq("branch_id", branch);
  }

  const { data: bringUps } = await query.order("due_date").returns<BringUpRow[]>();
  const branchOptions = user.role === "admin" ? await getSelectableBranches(supabase, user) : [];

  const weekFromNow = Date.now() + 7 * 24 * 60 * 60 * 1000;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Upcoming bring-ups</h1>
        <Link href="/calendar" className={buttonVariants({ variant: "outline" })}>
          Calendar view
        </Link>
      </div>

      {user.role === "admin" && (
        <form className="flex flex-wrap gap-3" method="get">
          <select
            name="branch"
            defaultValue={branch ?? ""}
            className="rounded-md border px-3 py-2 text-sm"
          >
            <option value="">All branches</option>
            {branchOptions.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <button type="submit" className={buttonVariants({ variant: "outline" })}>
            Filter
          </button>
        </form>
      )}

      <div className="space-y-2">
        {(bringUps ?? []).map((bringUp) => {
          const dueThisWeek = new Date(bringUp.due_date).getTime() <= weekFromNow;
          return (
            <div
              key={bringUp.id}
              className="flex items-start justify-between gap-4 rounded-lg border p-4"
            >
              <div>
                <p className="font-medium">
                  {bringUp.title}{" "}
                  <span className="text-xs text-muted-foreground uppercase">
                    {bringUp.event_type === "court_date" ? "Court date" : "Other"}
                  </span>
                  {dueThisWeek && (
                    <span className="ml-2 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                      Due this week
                    </span>
                  )}
                </p>
                <p className="text-sm text-muted-foreground">
                  Due {new Date(bringUp.due_date).toLocaleString()}
                  {bringUp.file_id && bringUp.files ? (
                    <>
                      {" "}
                      &middot;{" "}
                      <Link href={`/files/${bringUp.file_id}`} className="underline">
                        {bringUp.files.file_number}
                      </Link>{" "}
                      ({bringUp.files.clients?.name ?? "—"})
                    </>
                  ) : (
                    <> &middot; Standalone event</>
                  )}
                  {user.role === "admin" && <> &middot; {bringUp.branches?.name}</>}
                </p>
              </div>
              <form action={markBringUpDone.bind(null, bringUp.file_id, bringUp.id)}>
                <button type="submit" className={buttonVariants({ variant: "outline", size: "sm" })}>
                  Mark done
                </button>
              </form>
            </div>
          );
        })}
        {(bringUps ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">No upcoming bring-ups.</p>
        )}
      </div>
    </div>
  );
}
