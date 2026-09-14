import { signIn } from "./actions";
import { Button } from "@/components/ui/button";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <form action={signIn} className="w-full max-w-sm space-y-4 rounded-lg border p-6">
        <div>
          <h1 className="text-xl font-semibold">Waltz</h1>
          <p className="text-sm text-muted-foreground">Sign in to your account</p>
        </div>

        {error && (
          <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">{error}</p>
        )}

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <Button type="submit" className="w-full">
          Sign in
        </Button>
      </form>
    </div>
  );
}
