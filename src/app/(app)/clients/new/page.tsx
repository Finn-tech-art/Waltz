import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getSelectableBranches } from "@/lib/branch-access";
import { ClientForm } from "../client-form";
import { createClientRecord } from "../actions";

export default async function NewClientPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const branches = await getSelectableBranches(supabase, user);

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">New client</h1>
      {branches.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          You are not assigned to any branch, so you cannot create a client. Ask an admin to
          assign you to a branch.
        </p>
      ) : (
        <ClientForm action={createClientRecord} branches={branches} submitLabel="Create client" />
      )}
    </div>
  );
}
