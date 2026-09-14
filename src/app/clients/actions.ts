"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getSelectableBranches } from "@/lib/branch-access";

export type ClientFormState = { error?: string };

export async function createClientRecord(
  _prevState: ClientFormState,
  formData: FormData
): Promise<ClientFormState> {
  const user = await requireUser();
  const supabase = await createClient();

  const type = String(formData.get("type") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const contactEmail = String(formData.get("contactEmail") ?? "").trim();
  const contactPhone = String(formData.get("contactPhone") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const branchId = String(formData.get("branchId") ?? "");

  if (!name) return { error: "Name is required." };
  if (type !== "individual" && type !== "organization") {
    return { error: "Invalid client type." };
  }

  const selectable = await getSelectableBranches(supabase, user);
  if (!selectable.some((b) => b.id === branchId)) {
    return { error: "You are not assigned to that branch." };
  }

  const { data, error } = await supabase
    .from("clients")
    .insert({
      type,
      name,
      contact_email: contactEmail || null,
      contact_phone: contactPhone || null,
      notes: notes || null,
      branch_id: branchId,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/clients");
  redirect(`/clients/${data.id}`);
}

export async function updateClientRecord(
  clientId: string,
  _prevState: ClientFormState,
  formData: FormData
): Promise<ClientFormState> {
  await requireUser();
  const supabase = await createClient();

  const type = String(formData.get("type") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const contactEmail = String(formData.get("contactEmail") ?? "").trim();
  const contactPhone = String(formData.get("contactPhone") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!name) return { error: "Name is required." };
  if (type !== "individual" && type !== "organization") {
    return { error: "Invalid client type." };
  }

  const { error } = await supabase
    .from("clients")
    .update({
      type,
      name,
      contact_email: contactEmail || null,
      contact_phone: contactPhone || null,
      notes: notes || null,
    })
    .eq("id", clientId);

  if (error) return { error: error.message };

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/clients");
  return {};
}
