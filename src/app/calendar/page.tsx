import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getSelectableBranches, getBranchStaff } from "@/lib/branch-access";
import { buttonVariants } from "@/components/ui/button";
import { CalendarView } from "./calendar-view";
import { EventForm } from "./event-form";

type BringUpRow = {
  id: string;
  event_type: string;
  title: string;
  due_date: string;
  file_id: string | null;
  status: string;
};

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ eventBranchId?: string }>;
}) {
  const user = await requireUser();
  const { eventBranchId } = await searchParams;
  const supabase = await createClient();

  const { data: bringUps } = await supabase
    .from("bring_ups")
    .select("id, event_type, title, due_date, file_id, status")
    .eq("status", "upcoming")
    .returns<BringUpRow[]>();

  const branches = await getSelectableBranches(supabase, user);
  const selectedBranchId = eventBranchId ?? (branches.length === 1 ? branches[0].id : undefined);
  const staffOptions = selectedBranchId ? await getBranchStaff(supabase, selectedBranchId) : [];

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Calendar</h1>

      <CalendarView events={bringUps ?? []} />

      <section className="space-y-4 rounded-lg border p-6">
        <h2 className="text-lg font-medium">Add event</h2>

        {branches.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You are not assigned to any branch, so you cannot add an event.
          </p>
        ) : (
          <>
            {branches.length > 1 && (
              <form method="get" className="flex flex-wrap items-end gap-3">
                <div className="space-y-2">
                  <label htmlFor="eventBranchId" className="text-sm font-medium">
                    Branch
                  </label>
                  <select
                    id="eventBranchId"
                    name="eventBranchId"
                    defaultValue={eventBranchId ?? ""}
                    className="w-64 rounded-md border px-3 py-2 text-sm"
                  >
                    <option value="" disabled>
                      Select a branch&hellip;
                    </option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button type="submit" className={buttonVariants({ variant: "outline" })}>
                  Load branch
                </button>
              </form>
            )}

            {selectedBranchId && <EventForm branchId={selectedBranchId} staffOptions={staffOptions} />}
          </>
        )}
      </section>
    </div>
  );
}
