import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StaffForm } from "./staff-form";

type ProfileRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  user_branches: { branches: { name: string } | null }[];
};

export default async function AdminStaffPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: branches } = await supabase.from("branches").select("id, name").order("name");

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, email, role, user_branches(branches(name))")
    .order("name")
    .returns<ProfileRow[]>();

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Staff accounts</h1>
        <p className="text-sm text-muted-foreground">
          Create and manage staff and admin accounts. Branches themselves are managed directly in
          Supabase for now &mdash; there is no branch-management screen in this MVP.
        </p>
      </div>

      <section className="rounded-lg border p-6">
        <h2 className="mb-4 text-lg font-medium">Add account</h2>
        <StaffForm branches={branches ?? []} />
      </section>

      <section className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
              <th className="p-3">Branches</th>
            </tr>
          </thead>
          <tbody>
            {(profiles ?? []).map((profile) => (
              <tr key={profile.id} className="border-b last:border-0">
                <td className="p-3">{profile.name}</td>
                <td className="p-3">{profile.email}</td>
                <td className="p-3 capitalize">{profile.role}</td>
                <td className="p-3">
                  {profile.user_branches
                    .map((ub) => ub.branches?.name)
                    .filter(Boolean)
                    .join(", ") || "—"}
                </td>
              </tr>
            ))}
            {(profiles ?? []).length === 0 && (
              <tr>
                <td className="p-3 text-muted-foreground" colSpan={4}>
                  No accounts yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
