import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "staff";
  branchIds: string[];
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, email, role")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  const { data: branchRows } = await supabase
    .from("user_branches")
    .select("branch_id")
    .eq("user_id", user.id);

  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: profile.role as "admin" | "staff",
    branchIds: (branchRows ?? []).map((row) => row.branch_id as string),
  };
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/dashboard");
  return user;
}
