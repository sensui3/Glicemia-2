"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Activity, LayoutDashboard, Pill, ChevronLeft, ChevronRight, Stethoscope, Apple, CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function SidebarNav() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()

  const navItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      href: "/dashboard",
    },
    {
      title: "Alimentação",
      icon: Apple,
      href: "/dashboard/alimentacao/alimentos",
    },
    {
      title: "Planejamento",
      icon: CalendarDays,
      href: "/dashboard/planejamento",
    },
    {
      title: "Medicações",
      icon: Pill,
      href: "/dashboard/medicacoes",
    },
    {
      title: "Médicos",
      icon: Stethoscope,
      href: "/dashboard/medicos",
    },
  ]

  return (
    <aside
      className={cn(
        "hidden lg:flex bg-card border-r border-border transition-all duration-300 flex-col h-full",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      {/* Logo */}
      <div className="h-16 border-b border-border flex items-center justify-between px-4">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="bg-teal-600 rounded-lg p-1.5">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-sm">Controle Glicemia</span>
          </div>
        )}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsCollapsed(!isCollapsed)}>
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                  isActive
                    ? "bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && <span className="text-sm">{item.title}</span>}
              </div>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
