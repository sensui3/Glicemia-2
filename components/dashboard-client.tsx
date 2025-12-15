"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Plus, Coffee, Sun, Moon } from "lucide-react"
import { NovoRegistroModal } from "@/components/novo-registro-modal"
import { ExportarDadosModal } from "@/components/exportar-dados-modal"

type Props = {
  userId: string
  onDataChange: () => void
  sortOrder: "asc" | "desc"
}

export function DashboardClient({ userId, onDataChange, sortOrder }: Props) {
  const [isNovoRegistroOpen, setIsNovoRegistroOpen] = useState(false)
  const [isExportarOpen, setIsExportarOpen] = useState(false)
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null)

  const handleOpenTemplate = (template: string) => {
    setActiveTemplate(template)
    setIsNovoRegistroOpen(true)
  }

  return (
    <>
      {/* 1-Tap Entry & Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Giant Button */}
        <Button
          onClick={() => {
            setActiveTemplate(null)
            setIsNovoRegistroOpen(true)
          }}
          className="h-24 text-xl font-bold bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-8 h-8 mr-3" />
          NOVO REGISTRO
        </Button>

        {/* Quick Templates */}
        <div className="grid grid-cols-3 gap-3">
          <Button
            variant="outline"
            className="h-24 flex flex-col gap-2 border-2 hover:border-orange-200 hover:bg-orange-50 dark:hover:bg-orange-900/20"
            onClick={() => handleOpenTemplate("jejum")}
          >
            <Coffee className="w-6 h-6 text-amber-600" />
            <span className="font-medium">Jejum</span>
          </Button>
          <Button
            variant="outline"
            className="h-24 flex flex-col gap-2 border-2 hover:border-orange-200 hover:bg-orange-50 dark:hover:bg-orange-900/20"
            onClick={() => handleOpenTemplate("antes_refeicao")}
          >
            <Sun className="w-6 h-6 text-orange-500" />
            <span className="font-medium">Refeição</span>
          </Button>
          <Button
            variant="outline"
            className="h-24 flex flex-col gap-2 border-2 hover:border-orange-200 hover:bg-orange-50 dark:hover:bg-orange-900/20"
            onClick={() => handleOpenTemplate("ao_dormir")}
          >
            <Moon className="w-6 h-6 text-indigo-500" />
            <span className="font-medium">Ao Dormir</span>
          </Button>
        </div>
      </div>

      <div className="flex justify-end mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground h-12 px-6"
          onClick={() => setIsExportarOpen(true)}
        >
          <Download className="w-4 h-4 mr-2" />
          Exportar Relatório Completo
        </Button>
      </div>

      <NovoRegistroModal
        open={isNovoRegistroOpen}
        onOpenChange={(open) => {
          setIsNovoRegistroOpen(open)
          if (!open) setActiveTemplate(null)
        }}
        onDataChange={onDataChange}
        initialCondition={activeTemplate}
      />
      <ExportarDadosModal open={isExportarOpen} onOpenChange={setIsExportarOpen} userId={userId} sortOrder={sortOrder} />
    </>
  )
}
