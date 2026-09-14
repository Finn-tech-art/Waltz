import { requireUser } from "@/lib/auth";
import { signOut } from "@/app/login/actions";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Welcome, {user.name}</h1>
          <p className="text-sm text-muted-foreground capitalize">Role: {user.role}</p>
        </div>
        <form action={signOut}>
          <Button type="submit" variant="outline">
            Sign out
          </Button>
        </form>
      </div>

      <p className="text-sm text-muted-foreground">
        {user.role === "admin"
          ? "Branch dashboard cards will go here (Module 3)."
          : "Your branch dashboard will go here (Module 3)."}
      </p>

      {user.role === "admin" && (
        <a href="/admin/staff" className="text-sm underline">
          Manage staff accounts &rarr;
        </a>
      )}
    </div>
  );
}
