"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getSelectableBranches } from "@/lib/branch-access";

export type EventFormState = { error?: string };

export async function createStandaloneEvent(
  _prevState: EventFormState,
  formData: FormData
): Promise<EventFormState> {
  const user = await requireUser();
  const supabase = await createClient();

  const branchId = String(formData.get("branchId") ?? "");
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

  const selectable = await getSelectableBranches(supabase, user);
  if (!selectable.some((b) => b.id === branchId)) {
    return { error: "You are not assigned to that branch." };
  }

  const { data: event, error } = await supabase
    .from("bring_ups")
    .insert({
      branch_id: branchId,
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
      .insert(staffIds.map((staffId) => ({ bring_up_id: event.id, user_id: staffId })));
    if (staffError) return { error: staffError.message };
  }

  revalidatePath("/calendar");
  revalidatePath("/bring-ups");
  return {};
}
