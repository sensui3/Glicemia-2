"use client"

import { useState } from "react"
import { Activity, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LogoutButton } from "@/components/logout-button"
import { ConfiguracoesModal } from "@/components/configuracoes-modal"
import { MobileMenu } from "@/components/mobile-menu"

export function DashboardHeader() {
  const [isConfigOpen, setIsConfigOpen] = useState(false)

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <MobileMenu />
              <div className="bg-teal-600 rounded-lg p-2">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-sm sm:text-lg">CONTROLE DE GLICEMIA</span>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setIsConfigOpen(true)}>
                <Settings className="w-5 h-5" />
              </Button>
              <div className="hidden lg:block">
                <LogoutButton />
              </div>
            </div>
          </div>
        </div>
      </header>

      <ConfiguracoesModal open={isConfigOpen} onOpenChange={setIsConfigOpen} />
    </>
  )
}
