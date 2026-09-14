import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getSelectableBranches } from "@/lib/branch-access";
import { buttonVariants } from "@/components/ui/button";

type InvoiceRow = {
  id: string;
  invoice_number: string;
  status: string;
  total: number;
  branch_id: string;
  clients: { name: string } | null;
  files: { file_number: string } | null;
  branches: { name: string } | null;
};

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; branch?: string }>;
}) {
  const user = await requireUser();
  const { status, branch } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("invoices")
    .select(
      "id, invoice_number, status, total, branch_id, clients(name), files(file_number), branches(name)"
    );

  if (status) query = query.eq("status", status);
  if (user.role === "admin" && branch) query = query.eq("branch_id", branch);

  const { data: invoices } = await query
    .order("created_at", { ascending: false })
    .returns<InvoiceRow[]>();

  const branchOptions = user.role === "admin" ? await getSelectableBranches(supabase, user) : [];

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Invoices</h1>
        <Link href="/invoices/new" className={buttonVariants()}>
          New invoice
        </Link>
      </div>

      <form className="flex flex-wrap gap-3" method="get">
        <select
          name="status"
          defaultValue={status ?? ""}
          className="rounded-md border px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
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
              <th className="p-3">Invoice #</th>
              <th className="p-3">Client</th>
              <th className="p-3">File</th>
              <th className="p-3">Status</th>
              <th className="p-3">Total</th>
              {user.role === "admin" && <th className="p-3">Branch</th>}
            </tr>
          </thead>
          <tbody>
            {(invoices ?? []).map((invoice) => (
              <tr key={invoice.id} className="border-b last:border-0 hover:bg-muted/50">
                <td className="p-3">
                  <Link href={`/invoices/${invoice.id}`} className="underline">
                    {invoice.invoice_number}
                  </Link>
                </td>
                <td className="p-3">{invoice.clients?.name ?? "—"}</td>
                <td className="p-3">{invoice.files?.file_number ?? "—"}</td>
                <td className="p-3 capitalize">{invoice.status}</td>
                <td className="p-3">{Number(invoice.total).toFixed(2)}</td>
                {user.role === "admin" && <td className="p-3">{invoice.branches?.name ?? "—"}</td>}
              </tr>
            ))}
            {(invoices ?? []).length === 0 && (
              <tr>
                <td className="p-3 text-muted-foreground" colSpan={6}>
                  No invoices found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
