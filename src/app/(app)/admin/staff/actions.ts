"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export type StaffFormState = {
  error?: string;
  success?: boolean;
};

export async function createStaffAccount(
  _prevState: StaffFormState,
  formData: FormData
): Promise<StaffFormState> {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "staff");
  const branchIds = formData.getAll("branchIds").map(String);

  if (!name || !email || !password) {
    return { error: "Name, email, and password are required." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (role !== "admin" && role !== "staff") {
    return { error: "Invalid role." };
  }
  if (role === "staff" && branchIds.length === 0) {
    return { error: "Staff accounts need at least one branch assigned." };
  }

  const admin = createAdminClient();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError || !created.user) {
    return { error: createError?.message ?? "Failed to create account." };
  }

  const userId = created.user.id;

  const { error: profileError } = await admin.from("profiles").insert({
    id: userId,
    name,
    email,
    role,
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(userId);
    return { error: profileError.message };
  }

  if (branchIds.length > 0) {
    const { error: branchError } = await admin
      .from("user_branches")
      .insert(branchIds.map((branchId) => ({ user_id: userId, branch_id: branchId })));

    if (branchError) {
      await admin.auth.admin.deleteUser(userId);
      return { error: branchError.message };
    }
  }

  revalidatePath("/admin/staff");
  return { success: true };
}
