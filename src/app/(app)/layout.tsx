import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app-shell/app-shell";

export default async function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return <AppShell user={user}>{children}</AppShell>;
}
