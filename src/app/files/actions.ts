"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type FileFormState = { error?: string };

export async function createFileRecord(
  _prevState: FileFormState,
  formData: FormData
): Promise<FileFormState> {
  const user = await requireUser();
  const supabase = await createClient();

  const clientId = String(formData.get("clientId") ?? "");
  const matterType = String(formData.get("matterType") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const responsibleLawyerId = String(formData.get("responsibleLawyerId") ?? "");

  if (!clientId) return { error: "A client is required." };

  const { data: client } = await supabase
    .from("clients")
    .select("id, branch_id")
    .eq("id", clientId)
    .maybeSingle();

  if (!client) return { error: "Client not found or you don't have access to it." };

  const { data, error } = await supabase
    .from("files")
    .insert({
      client_id: clientId,
      branch_id: client.branch_id,
      matter_type: matterType || null,
      description: description || null,
      responsible_lawyer_id: responsibleLawyerId || null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/files");
  revalidatePath(`/clients/${clientId}`);
  redirect(`/files/${data.id}`);
}

export async function updateFileRecord(
  fileId: string,
  _prevState: FileFormState,
  formData: FormData
): Promise<FileFormState> {
  await requireUser();
  const supabase = await createClient();

  const matterType = String(formData.get("matterType") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const responsibleLawyerId = String(formData.get("responsibleLawyerId") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!["open", "pending", "closed"].includes(status)) {
    return { error: "Invalid status." };
  }

  const { error } = await supabase
    .from("files")
    .update({
      matter_type: matterType || null,
      description: description || null,
      responsible_lawyer_id: responsibleLawyerId || null,
      status,
    })
    .eq("id", fileId);

  if (error) return { error: error.message };

  revalidatePath(`/files/${fileId}`);
  revalidatePath("/files");
  return {};
}

export type BringUpFormState = { error?: string };

export async function createBringUp(
  fileId: string,
  _prevState: BringUpFormState,
  formData: FormData
): Promise<BringUpFormState> {
  const user = await requireUser();
  const supabase = await createClient();

  const eventType = String(formData.get("eventType") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const dueDate = String(formData.get("dueDate") ?? "");
  const staffIds = formData.getAll("staffIds").map(String);

  if (!title) return { error: "Title is required." };
  if (eventType !== "court_date" && eventType !== "other") {
    return { error: "Invalid event type." };
  }
  if (!dueDate) return { error: "Due date is required." };

  const { data: bringUp, error } = await supabase
    .from("bring_ups")
    .insert({
      file_id: fileId,
      event_type: eventType,
      title,
      description: description || null,
      due_date: new Date(dueDate).toISOString(),
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  if (staffIds.length > 0) {
    const { error: staffError } = await supabase
      .from("bring_up_staff")
      .insert(staffIds.map((staffId) => ({ bring_up_id: bringUp.id, user_id: staffId })));
    if (staffError) return { error: staffError.message };
  }

  revalidatePath(`/files/${fileId}`);
  revalidatePath("/bring-ups");
  return {};
}

export async function markBringUpDone(fileId: string, bringUpId: string) {
  await requireUser();
  const supabase = await createClient();

  await supabase.from("bring_ups").update({ status: "done" }).eq("id", bringUpId);

  revalidatePath(`/files/${fileId}`);
  revalidatePath("/bring-ups");
}
