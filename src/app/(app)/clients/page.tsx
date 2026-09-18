import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getSelectableBranches } from "@/lib/branch-access";
import { buttonVariants } from "@/components/ui/button";

type ClientRow = {
  id: string;
  name: string;
  type: string;
  contact_email: string | null;
  contact_phone: string | null;
  branch_id: string;
  branches: { name: string } | null;
};

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; branch?: string }>;
}) {
  const user = await requireUser();
  const { q, branch } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("clients")
    .select("id, name, type, contact_email, contact_phone, branch_id, branches(name)");

  if (q) query = query.ilike("name", `%${q}%`);
  if (user.role === "admin" && branch) query = query.eq("branch_id", branch);

  const { data: clients } = await query.order("name").returns<ClientRow[]>();
  const branchOptions = user.role === "admin" ? await getSelectableBranches(supabase, user) : [];

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Clients</h1>
        <Link href="/clients/new" className={buttonVariants()}>
          New client
        </Link>
      </div>

      <form className="flex flex-wrap gap-3" method="get">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by name"
          className="rounded-md border px-3 py-2 text-sm"
        />
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
              <th className="p-3">Name</th>
              <th className="p-3">Type</th>
              <th className="p-3">Contact</th>
              {user.role === "admin" && <th className="p-3">Branch</th>}
            </tr>
          </thead>
          <tbody>
            {(clients ?? []).map((c) => (
              <tr key={c.id} className="border-b last:border-0 hover:bg-muted/50">
                <td className="p-3">
                  <Link href={`/clients/${c.id}`} className="underline">
                    {c.name}
                  </Link>
                </td>
                <td className="p-3 capitalize">{c.type}</td>
                <td className="p-3">{c.contact_email || c.contact_phone || "—"}</td>
                {user.role === "admin" && <td className="p-3">{c.branches?.name ?? "—"}</td>}
              </tr>
            ))}
            {(clients ?? []).length === 0 && (
              <tr>
                <td className="p-3 text-muted-foreground" colSpan={4}>
                  No clients found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
