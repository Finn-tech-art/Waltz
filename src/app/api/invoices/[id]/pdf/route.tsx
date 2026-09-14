import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { InvoiceDocument, type InvoicePdfData } from "./invoice-document";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { data: invoice } = await supabase
    .from("invoices")
    .select("invoice_number, status, subtotal, total, clients(name), files(file_number), branches(name)")
    .eq("id", id)
    .maybeSingle();

  if (!invoice) return new NextResponse("Not found", { status: 404 });

  const { data: lineItems } = await supabase
    .from("invoice_line_items")
    .select("description, fee_basis, rate, hours, amount")
    .eq("invoice_id", id)
    .order("created_at");

  const client = invoice.clients as unknown as { name: string } | null;
  const file = invoice.files as unknown as { file_number: string } | null;
  const branch = invoice.branches as unknown as { name: string } | null;

  const pdfData: InvoicePdfData = {
    invoiceNumber: invoice.invoice_number,
    status: invoice.status,
    clientName: client?.name ?? "—",
    fileNumber: file?.file_number ?? null,
    branchName: branch?.name ?? "—",
    subtotal: Number(invoice.subtotal),
    total: Number(invoice.total),
    lineItems: (lineItems ?? []).map((item) => ({
      description: item.description,
      feeBasis: item.fee_basis,
      rate: item.rate,
      hours: item.hours,
      amount: Number(item.amount),
    })),
  };

  const buffer = await renderToBuffer(<InvoiceDocument data={pdfData} />);

  return new NextResponse(Uint8Array.from(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${invoice.invoice_number}.pdf"`,
    },
  });
}
