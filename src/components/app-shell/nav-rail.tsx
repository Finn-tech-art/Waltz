"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  Bell,
  CalendarDays,
  Receipt,
  UserCog,
} from "lucide-react"
import { cn } from "@/lib/utils"

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/files", label: "Files", icon: FolderOpen },
  { href: "/bring-ups", label: "Bring-ups", icon: Bell },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/invoices", label: "Invoices", icon: Receipt },
]

const adminNavItems: NavItem[] = [
  { href: "/admin/staff", label: "Staff", icon: UserCog },
]

export function NavRail({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname()
  const items = isAdmin ? [...navItems, ...adminNavItems] : navItems

  return (
    <nav
      aria-label="Primary"
      className="flex w-14 shrink-0 flex-col items-center gap-0.5 bg-sidebar py-2"
    >
      {items.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex w-11 flex-col items-center gap-0.5 rounded-md py-1.5 text-[10px] font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground",
              active && "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground"
            )}
          >
            <Icon className="size-[18px]" />
            <span className="leading-none">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
