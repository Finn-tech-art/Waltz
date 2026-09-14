import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { LineItemForm } from "./line-item-form";
import { updateInvoiceStatus } from "../actions";

type LineItemRow = {
  id: string;
  description: string;
  fee_basis: string;
  rate: number | null;
  hours: number | null;
  amount: number;
};

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const supabase = await createClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select(
      "id, invoice_number, status, subtotal, total, clients(name), files(id, file_number), branches(name)"
    )
    .eq("id", id)
    .maybeSingle();

  if (!invoice) notFound();

  const { data: lineItems } = await supabase
    .from("invoice_line_items")
    .select("id, description, fee_basis, rate, hours, amount")
    .eq("invoice_id", id)
    .order("created_at")
    .returns<LineItemRow[]>();

  const client = invoice.clients as unknown as { name: string } | null;
  const file = invoice.files as unknown as { id: string; file_number: string } | null;
  const branch = invoice.branches as unknown as { name: string } | null;

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{invoice.invoice_number}</h1>
          <p className="text-sm text-muted-foreground">
            Client: {client?.name ?? "—"} &middot; File:{" "}
            {file ? (
              <Link href={`/files/${file.id}`} className="underline">
                {file.file_number}
              </Link>
            ) : (
              "—"
            )}{" "}
            &middot; Branch: {branch?.name ?? "—"}
          </p>
        </div>
        <a
          href={`/api/invoices/${id}/pdf`}
          className={buttonVariants({ variant: "outline" })}
          target="_blank"
        >
          Download PDF
        </a>
      </div>

      <section className="flex items-center gap-4 rounded-lg border p-4">
        <form action={updateInvoiceStatus.bind(null, id)} className="flex items-center gap-3">
          <label htmlFor="status" className="text-sm font-medium">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={invoice.status}
            className="rounded-md border px-3 py-2 text-sm"
          >
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
          </select>
          <button type="submit" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Update
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Line items</h2>

        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-3">Description</th>
                <th className="p-3">Basis</th>
                <th className="p-3">Rate x Hours</th>
                <th className="p-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(lineItems ?? []).map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="p-3">{item.description}</td>
                  <td className="p-3 capitalize">{item.fee_basis.replace(/_/g, " ")}</td>
                  <td className="p-3">
                    {item.fee_basis === "hourly" ? `${item.rate} x ${item.hours}` : "—"}
                  </td>
                  <td className="p-3 text-right">{Number(item.amount).toFixed(2)}</td>
                </tr>
              ))}
              {(lineItems ?? []).length === 0 && (
                <tr>
                  <td className="p-3 text-muted-foreground" colSpan={4}>
                    No line items yet.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t font-medium">
                <td className="p-3" colSpan={3}>
                  Subtotal
                </td>
                <td className="p-3 text-right">{Number(invoice.subtotal).toFixed(2)}</td>
              </tr>
              <tr className="font-semibold">
                <td className="p-3" colSpan={3}>
                  Total
                </td>
                <td className="p-3 text-right">{Number(invoice.total).toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <LineItemForm invoiceId={id} />
      </section>
    </div>
  );
}
