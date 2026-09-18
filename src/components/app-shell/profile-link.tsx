import Link from "next/link"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { CurrentUser } from "@/lib/auth"

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("")
}

export function ProfileLink({ user }: { user: CurrentUser }) {
  return (
    <Link
      href="/profile"
      title={`${user.name} — view profile`}
      aria-label="View profile"
      className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Avatar>
        <AvatarFallback>{initials(user.name)}</AvatarFallback>
      </Avatar>
    </Link>
  )
}
