"use client"

import { useState, useEffect } from "react"
import { Activity, Settings, Plus, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LogoutButton } from "@/components/logout-button"
import { ConfiguracoesModal } from "@/components/configuracoes-modal"
import { MobileMenu } from "@/components/mobile-menu"
import { ModeToggle } from "@/components/mode-toggle"
import { NovoRegistroModal } from "@/components/novo-registro-modal"
import { ExportarDadosModal } from "@/components/exportar-dados-modal"
import { createClient } from "@/lib/supabase/client"
import { useQueryClient } from "@tanstack/react-query"

export function DashboardHeader() {
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [isNovoRegistroOpen, setIsNovoRegistroOpen] = useState(false)
  const [isExportarOpen, setIsExportarOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const queryClient = useQueryClient()

  useEffect(() => {
    // Fetch User ID for Export Modal
    const getUser = async () => {
      const supabase = createClient()
      const { data } = await supabase.auth.getUser()
      if (data?.user) {
        setUserId(data.user.id)
      }
    }
    getUser()
  }, [])

  const handleDataChange = async () => {
    // Invalidate queries to refresh dashboard data when a new record is added via header
    await queryClient.invalidateQueries({ queryKey: ["glucose-data"] })
  }

  return (
    <>
      <header className="bg-background border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <MobileMenu />
              <div className="bg-primary rounded-lg p-2">
                <Activity className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-sm sm:text-lg">CONTROLE DE GLICEMIA</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="icon"
                onClick={() => setIsNovoRegistroOpen(true)}
                className="hidden sm:flex bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-sm hover:scale-105 transition-all border-0"
                title="Novo Registro"
              >
                <Plus className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExportarOpen(true)}
                className="hidden sm:flex hover:bg-muted"
                title="Imprimir / Exportar"
              >
                <Printer className="w-5 h-5" />
              </Button>

              <div className="h-6 w-px bg-border hidden sm:block mx-1"></div>

              <Button variant="ghost" size="icon" onClick={() => setIsConfigOpen(true)} aria-label="Configurações">
                <Settings className="w-5 h-5" />
              </Button>
              <ModeToggle />
              <div className="hidden lg:block">
                <LogoutButton />
              </div>
            </div>
          </div>
        </div>
      </header>

      <ConfiguracoesModal open={isConfigOpen} onOpenChange={setIsConfigOpen} />

      <NovoRegistroModal
        open={isNovoRegistroOpen}
        onOpenChange={setIsNovoRegistroOpen}
        onDataChange={handleDataChange}
      />

      {userId && (
        <ExportarDadosModal
          open={isExportarOpen}
          onOpenChange={setIsExportarOpen}
          userId={userId}
          sortOrder="desc"
        />
      )}
    </>
  )
}
