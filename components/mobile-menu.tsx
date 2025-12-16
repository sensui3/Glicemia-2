"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Activity, LayoutDashboard, Pill, Menu, LogOut, Stethoscope, Apple, CalendarDays } from "lucide-react"


import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()

  // Prevent hydration mismatch by ensuring component only renders on client
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menu">
        <Menu className="w-5 h-5" />
      </Button>
    )
  }

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

  const handleLogout = async () => {
    setIsLoggingOut(true)

    try {
      const supabase = createClient()
      await supabase.auth.signOut()

      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso",
      })

      setIsOpen(false)
      router.push("/auth/login")
      router.refresh()
    } catch (error) {
      toast({
        title: "Erro ao sair",
        description: "Não foi possível fazer logout. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menu">
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b border-border p-4">
          <SheetTitle className="flex items-center gap-2 text-left">
            <div className="bg-primary rounded-lg p-1.5">
              <Activity className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm">Controle Glicemia</span>
          </SheetTitle>
          <SheetDescription className="sr-only">
            Menu de navegação principal para dispositivos móveis
          </SheetDescription>
        </SheetHeader>

        <nav className="flex flex-col h-[calc(100%-80px)]">
          <div className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)}>
                  <div
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span className="text-sm">{item.title}</span>
                  </div>
                </Link>
              )
            })}
          </div>

          <Separator />

          <div className="p-4">
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              <LogOut className="h-5 w-5 mr-3" />
              {isLoggingOut ? "Saindo..." : "Sair"}
            </Button>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
