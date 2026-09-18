import Link from "next/link"
import { Search } from "lucide-react"
import { ProfileLink } from "./profile-link"
import type { CurrentUser } from "@/lib/auth"

export function TopBar({ user }: { user: CurrentUser }) {
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-background px-3">
      <Link href="/dashboard" className="flex shrink-0 items-center gap-2 font-semibold">
        <span className="flex size-7 items-center justify-center rounded-md bg-primary text-sm text-primary-foreground">
          W
        </span>
        <span className="hidden sm:inline">Waltz</span>
      </Link>

      <form method="get" action="/clients" className="relative mx-auto w-full max-w-xl">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          name="q"
          placeholder="Search clients"
          className="h-8 w-full rounded-md border border-border bg-muted/40 pr-3 pl-9 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </form>

      <ProfileLink user={user} />
    </header>
  )
}
