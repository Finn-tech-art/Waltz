"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type InvoiceFormState = { error?: string };

export async function createInvoice(
  _prevState: InvoiceFormState,
  formData: FormData
): Promise<InvoiceFormState> {
  const user = await requireUser();
  const supabase = await createClient();

  const fileId = String(formData.get("fileId") ?? "");
  if (!fileId) return { error: "A file is required." };

  const { data: file } = await supabase
    .from("files")
    .select("id, client_id, branch_id")
    .eq("id", fileId)
    .maybeSingle();

  if (!file) return { error: "File not found or you don't have access to it." };

  const { data, error } = await supabase
    .from("invoices")
    .insert({
      file_id: file.id,
      client_id: file.client_id,
      branch_id: file.branch_id,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/invoices");
  redirect(`/invoices/${data.id}`);
}

async function recalculateInvoiceTotals(
  supabase: Awaited<ReturnType<typeof createClient>>,
  invoiceId: string
) {
  const { data: lineItems } = await supabase
    .from("invoice_line_items")
    .select("amount")
    .eq("invoice_id", invoiceId);

  const subtotal = (lineItems ?? []).reduce((sum, item) => sum + Number(item.amount), 0);

  await supabase
    .from("invoices")
    .update({ subtotal, total: subtotal })
    .eq("id", invoiceId);
}

export type LineItemFormState = { error?: string };

export async function addLineItem(
  invoiceId: string,
  _prevState: LineItemFormState,
  formData: FormData
): Promise<LineItemFormState> {
  await requireUser();
  const supabase = await createClient();

  const description = String(formData.get("description") ?? "").trim();
  const feeBasis = String(formData.get("feeBasis") ?? "");

  if (!description) return { error: "Description is required." };
  if (!["fixed", "hourly", "percentage_of_value"].includes(feeBasis)) {
    return { error: "Invalid fee basis." };
  }

  let rate: number | null = null;
  let hours: number | null = null;
  let amount: number;

  if (feeBasis === "hourly") {
    rate = Number(formData.get("rate"));
    hours = Number(formData.get("hours"));
    if (!Number.isFinite(rate) || rate < 0 || !Number.isFinite(hours) || hours < 0) {
      return { error: "Rate and hours must be valid non-negative numbers." };
    }
    amount = rate * hours;
  } else {
    amount = Number(formData.get("amount"));
    if (!Number.isFinite(amount) || amount < 0) {
      return { error: "Amount must be a valid non-negative number." };
    }
  }

  const { error } = await supabase.from("invoice_line_items").insert({
    invoice_id: invoiceId,
    description,
    fee_basis: feeBasis,
    rate,
    hours,
    amount,
  });

  if (error) return { error: error.message };

  await recalculateInvoiceTotals(supabase, invoiceId);

  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/invoices");
  return {};
}

export async function updateInvoiceStatus(invoiceId: string, formData: FormData) {
  await requireUser();
  const supabase = await createClient();

  const status = String(formData.get("status") ?? "");
  if (!["draft", "sent", "paid", "unpaid"].includes(status)) return;

  await supabase.from("invoices").update({ status }).eq("id", invoiceId);

  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/invoices");
}
