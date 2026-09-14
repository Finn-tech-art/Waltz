import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { ClientForm } from "../client-form";
import { updateClientRecord } from "../actions";

type FileRow = {
  id: string;
  file_number: string;
  matter_type: string | null;
  status: string;
};

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("id, type, name, contact_email, contact_phone, notes, branches(name)")
    .eq("id", id)
    .maybeSingle();

  if (!client) notFound();

  const { data: files } = await supabase
    .from("files")
    .select("id, file_number, matter_type, status")
    .eq("client_id", id)
    .order("created_at", { ascending: false })
    .returns<FileRow[]>();

  const boundUpdate = updateClientRecord.bind(null, id);

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold">{client.name}</h1>
        <p className="text-sm text-muted-foreground">
          Branch: {(client.branches as unknown as { name: string } | null)?.name ?? "—"}
        </p>
      </div>

      <section className="rounded-lg border p-6">
        <h2 className="mb-4 text-lg font-medium">Details</h2>
        <ClientForm
          action={boundUpdate}
          defaultValues={{
            type: client.type,
            name: client.name,
            contactEmail: client.contact_email ?? "",
            contactPhone: client.contact_phone ?? "",
            notes: client.notes ?? "",
          }}
          submitLabel="Save changes"
        />
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Files</h2>
          <Link href={`/files/new?clientId=${id}`} className={buttonVariants({ size: "sm" })}>
            New file
          </Link>
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-3">File #</th>
                <th className="p-3">Matter type</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {(files ?? []).map((file) => (
                <tr key={file.id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="p-3">
                    <Link href={`/files/${file.id}`} className="underline">
                      {file.file_number}
                    </Link>
                  </td>
                  <td className="p-3">{file.matter_type ?? "—"}</td>
                  <td className="p-3 capitalize">{file.status}</td>
                </tr>
              ))}
              {(files ?? []).length === 0 && (
                <tr>
                  <td className="p-3 text-muted-foreground" colSpan={3}>
                    No files yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
