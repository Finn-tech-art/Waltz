import { NavRail } from "./nav-rail"
import { TopBar } from "./top-bar"
import type { CurrentUser } from "@/lib/auth"

export function AppShell({
  user,
  children,
}: {
  user: CurrentUser
  children: React.ReactNode
}) {
  return (
    <div className="flex h-dvh flex-col">
      <TopBar user={user} />
      <div className="flex min-h-0 flex-1">
        <NavRail isAdmin={user.role === "admin"} />
        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
