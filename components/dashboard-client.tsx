"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Plus } from "lucide-react"
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

  return (
    <>
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Button
          variant="outline"
          className="flex-1 bg-transparent border-teal-600 text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20"
          onClick={() => setIsExportarOpen(true)}
        >
          <Download className="w-4 h-4 mr-2" />
          EXPORTAR DADOS
        </Button>
        <Button onClick={() => setIsNovoRegistroOpen(true)} className="flex-1 bg-orange-500 hover:bg-orange-600">
          <Plus className="w-4 h-4 mr-2" />
          NOVO REGISTRO
        </Button>
      </div>

      <NovoRegistroModal open={isNovoRegistroOpen} onOpenChange={setIsNovoRegistroOpen} onDataChange={onDataChange} />
      <ExportarDadosModal open={isExportarOpen} onOpenChange={setIsExportarOpen} userId={userId} sortOrder={sortOrder} />
    </>
  )
}
