import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getSelectableBranches } from "@/lib/branch-access";
import { buttonVariants } from "@/components/ui/button";

type FileRow = {
  id: string;
  file_number: string;
  matter_type: string | null;
  status: string;
  branch_id: string;
  clients: { name: string } | null;
  branches: { name: string } | null;
  profiles: { name: string } | null;
};

export default async function FilesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; branch?: string }>;
}) {
  const user = await requireUser();
  const { q, status, branch } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("files")
    .select(
      "id, file_number, matter_type, status, branch_id, clients(name), branches(name), profiles!files_responsible_lawyer_id_fkey(name)"
    );

  if (status) query = query.eq("status", status);
  if (user.role === "admin" && branch) query = query.eq("branch_id", branch);

  if (q) {
    const { data: matchingClients } = await supabase
      .from("clients")
      .select("id")
      .ilike("name", `%${q}%`);
    const clientIds = (matchingClients ?? []).map((c) => c.id);

    if (clientIds.length > 0) {
      query = query.or(`file_number.ilike.%${q}%,client_id.in.(${clientIds.join(",")})`);
    } else {
      query = query.ilike("file_number", `%${q}%`);
    }
  }

  const { data: files } = await query
    .order("created_at", { ascending: false })
    .returns<FileRow[]>();
  const branchOptions = user.role === "admin" ? await getSelectableBranches(supabase, user) : [];

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Files</h1>
        <Link href="/files/new" className={buttonVariants()}>
          New file
        </Link>
      </div>

      <form className="flex flex-wrap gap-3" method="get">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by file # or client name"
          className="w-64 rounded-md border px-3 py-2 text-sm"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="rounded-md border px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="pending">Pending</option>
          <option value="closed">Closed</option>
        </select>
        {user.role === "admin" && (
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
        )}
        <button type="submit" className={buttonVariants({ variant: "outline" })}>
          Filter
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="p-3">File #</th>
              <th className="p-3">Client</th>
              <th className="p-3">Matter type</th>
              <th className="p-3">Status</th>
              <th className="p-3">Responsible lawyer</th>
              {user.role === "admin" && <th className="p-3">Branch</th>}
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
                <td className="p-3">{file.clients?.name ?? "—"}</td>
                <td className="p-3">{file.matter_type ?? "—"}</td>
                <td className="p-3 capitalize">{file.status}</td>
                <td className="p-3">{file.profiles?.name ?? "—"}</td>
                {user.role === "admin" && <td className="p-3">{file.branches?.name ?? "—"}</td>}
              </tr>
            ))}
            {(files ?? []).length === 0 && (
              <tr>
                <td className="p-3 text-muted-foreground" colSpan={6}>
                  No files found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
