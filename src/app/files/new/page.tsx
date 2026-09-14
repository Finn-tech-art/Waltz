import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getBranchStaff } from "@/lib/branch-access";
import { buttonVariants } from "@/components/ui/button";
import { NewFileForm } from "./new-file-form";

export default async function NewFilePage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  await requireUser();
  const { clientId } = await searchParams;
  const supabase = await createClient();

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, branch_id")
    .order("name");

  const selectedClient = (clients ?? []).find((c) => c.id === clientId);
  const staffOptions = selectedClient
    ? await getBranchStaff(supabase, selectedClient.branch_id)
    : [];

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">New file</h1>

      {(clients ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">
          There are no clients yet.{" "}
          <Link href="/clients/new" className="underline">
            Create a client
          </Link>{" "}
          first.
        </p>
      ) : (
        <>
          <form method="get" className="flex flex-wrap items-end gap-3">
            <div className="space-y-2">
              <label htmlFor="clientId" className="text-sm font-medium">
                Client
              </label>
              <select
                id="clientId"
                name="clientId"
                defaultValue={clientId ?? ""}
                className="w-64 rounded-md border px-3 py-2 text-sm"
              >
                <option value="" disabled>
                  Select a client&hellip;
                </option>
                {(clients ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className={buttonVariants({ variant: "outline" })}>
              Load client
            </button>
          </form>

          {selectedClient && (
            <NewFileForm clientId={selectedClient.id} staffOptions={staffOptions} />
          )}
        </>
      )}
    </div>
  );
}
