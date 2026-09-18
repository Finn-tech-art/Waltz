import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { ProfileNameForm } from "./profile-name-form";
import { PasswordForm } from "./password-form";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

export default async function ProfilePage() {
  const user = await requireUser();
  const supabase = await createClient();

  const branches =
    user.role === "admin"
      ? null
      : user.branchIds.length > 0
        ? (
            await supabase
              .from("branches")
              .select("id, name")
              .in("id", user.branchIds)
              .order("name")
          ).data
        : [];

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="size-14">
            <AvatarFallback className="text-lg">{initials(user.name)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-semibold">{user.name}</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <Badge variant="accent" className="capitalize">
          {user.role}
        </Badge>
      </div>

      <section className="space-y-2 rounded-lg border p-6">
        <h2 className="text-lg font-medium">Branches</h2>
        {user.role === "admin" ? (
          <p className="text-sm text-muted-foreground">
            Admins have access to all branches.
          </p>
        ) : branches && branches.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {branches.map((branch) => (
              <li key={branch.id}>
                <Badge variant="secondary">{branch.name}</Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            You are not assigned to any branch yet. Ask an admin to assign you to one.
          </p>
        )}
      </section>

      <section className="space-y-4 rounded-lg border p-6">
        <h2 className="text-lg font-medium">Your name</h2>
        <ProfileNameForm name={user.name} />
      </section>

      <section className="space-y-4 rounded-lg border p-6">
        <h2 className="text-lg font-medium">Password</h2>
        <PasswordForm />
      </section>

      {user.role === "admin" && (
        <section className="space-y-2 rounded-lg border p-6">
          <h2 className="text-lg font-medium">Administration</h2>
          <Link href="/admin/staff" className={buttonVariants({ variant: "outline" })}>
            Manage staff accounts
          </Link>
        </section>
      )}

      <section className="space-y-2 rounded-lg border p-6">
        <h2 className="text-lg font-medium">Session</h2>
        <form action={signOut}>
          <Button type="submit" variant="outline">
            Sign out
          </Button>
        </form>
      </section>
    </div>
  );
}
