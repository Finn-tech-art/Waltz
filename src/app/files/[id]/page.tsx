import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getBranchStaff } from "@/lib/branch-access";
import { buttonVariants } from "@/components/ui/button";
import { EditFileForm } from "./edit-file-form";
import { BringUpForm } from "./bring-up-form";
import { markBringUpDone } from "../actions";

type BringUpRow = {
  id: string;
  event_type: string;
  title: string;
  description: string | null;
  due_date: string;
  status: string;
  bring_up_staff: { profiles: { name: string } | null }[];
};

export default async function FileDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const supabase = await createClient();

  const { data: file } = await supabase
    .from("files")
    .select(
      "id, file_number, matter_type, description, status, branch_id, client_id, responsible_lawyer_id, clients(name), branches(name)"
    )
    .eq("id", id)
    .maybeSingle();

  if (!file) notFound();

  const [{ data: bringUps }, staffOptions] = await Promise.all([
    supabase
      .from("bring_ups")
      .select("id, event_type, title, description, due_date, status, bring_up_staff(profiles(name))")
      .eq("file_id", id)
      .order("due_date")
      .returns<BringUpRow[]>(),
    getBranchStaff(supabase, file.branch_id),
  ]);

  const client = file.clients as unknown as { name: string } | null;
  const branch = file.branches as unknown as { name: string } | null;

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold">{file.file_number}</h1>
        <p className="text-sm text-muted-foreground">
          Client:{" "}
          <Link href={`/clients/${file.client_id}`} className="underline">
            {client?.name ?? "—"}
          </Link>{" "}
          &middot; Branch: {branch?.name ?? "—"}
        </p>
      </div>

      <section className="rounded-lg border p-6">
        <h2 className="mb-4 text-lg font-medium">Details</h2>
        <EditFileForm
          fileId={id}
          staffOptions={staffOptions}
          defaultValues={{
            matterType: file.matter_type ?? "",
            description: file.description ?? "",
            responsibleLawyerId: file.responsible_lawyer_id ?? "",
            status: file.status,
          }}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Bring-ups</h2>

        <div className="space-y-2">
          {(bringUps ?? []).map((bringUp) => (
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
                </p>
                <p className="text-sm text-muted-foreground">
                  Due {new Date(bringUp.due_date).toLocaleString()}
                </p>
                {bringUp.description && <p className="text-sm">{bringUp.description}</p>}
                {bringUp.bring_up_staff.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Assigned:{" "}
                    {bringUp.bring_up_staff
                      .map((row) => row.profiles?.name)
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}
              </div>
              {bringUp.status === "upcoming" ? (
                <form action={markBringUpDone.bind(null, id, bringUp.id)}>
                  <button type="submit" className={buttonVariants({ variant: "outline", size: "sm" })}>
                    Mark done
                  </button>
                </form>
              ) : (
                <span className="text-xs text-muted-foreground uppercase">Done</span>
              )}
            </div>
          ))}
          {(bringUps ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">No bring-ups yet.</p>
          )}
        </div>

        <BringUpForm fileId={id} staffOptions={staffOptions} />
      </section>
    </div>
  );
}
