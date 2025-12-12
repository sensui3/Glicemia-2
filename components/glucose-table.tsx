"use client"

import { type GlucoseReading, type GlucoseStatus, getGlucoseStatus } from "@/lib/types"
import { Utensils, Moon, Coffee, MoreHorizontal, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TablePagination } from "@/components/table-pagination"
import { TableFilters } from "@/components/table-filters"
import { useState } from "react"
import { EditarRegistroModal } from "@/components/editar-registro-modal"
import { DeleteReadingButton } from "@/components/delete-reading-button"

type Props = {
  readings: GlucoseReading[]
  totalPages: number
  totalItems: number
  currentPage: number
  currentFilter: string
  onFilterChange: (filter: string, startDate?: string, endDate?: string) => void
  onPageChange: (page: number) => void
  onDataChange: () => void
}

function getConditionIcon(condition: string) {
  switch (condition) {
    case "jejum":
      return <Coffee className="w-5 h-5" />
    case "antes_refeicao":
      return <Utensils className="w-5 h-5" />
    case "apos_refeicao":
      return <Utensils className="w-5 h-5" />
    case "ao_dormir":
      return <Moon className="w-5 h-5" />
    default:
      return <MoreHorizontal className="w-5 h-5" />
  }
}

function getConditionLabel(condition: string, time?: string) {
  switch (condition) {
    case "jejum":
      return "Jejum"
    case "antes_refeicao": {
      if (time) {
        const hour = Number.parseInt(time.split(":")[0])
        if (hour >= 5 && hour < 10) return "Antes do Café da Manhã"
        if (hour >= 10 && hour < 15) return "Antes do Almoço"
        if (hour >= 15 && hour < 18) return "Antes do Lanche"
        if (hour >= 18 && hour < 23) return "Antes do Jantar"
        return "Antes da Ceia"
      }
      return "Antes Ref."
    }
    case "apos_refeicao": {
      if (time) {
        const hour = Number.parseInt(time.split(":")[0])
        if (hour >= 5 && hour < 10) return "Após Café da Manhã"
        if (hour >= 10 && hour < 15) return "Após Almoço"
        if (hour >= 15 && hour < 18) return "Após Lanche"
        if (hour >= 18 && hour < 23) return "Após Jantar"
        return "Após Ceia"
      }
      return "Após Ref."
    }
    case "ao_dormir":
      return "Ao Dormir"
    default:
      return "Outro"
  }
}

function getStatusBadge(status: GlucoseStatus) {
  const styles = {
    normal: "bg-green-100 text-green-800",
    alto: "bg-red-100 text-red-800",
    baixo: "bg-yellow-100 text-yellow-800",
    atencao: "bg-orange-100 text-orange-800",
  }

  const labels = {
    normal: "Normal",
    alto: "Alto",
    baixo: "Baixo",
    atencao: "Atenção",
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}

export function GlucoseTable({
  readings,
  totalPages,
  totalItems,
  currentPage,
  currentFilter,
  onFilterChange,
  onPageChange,
  onDataChange,
}: Props) {
  const [editingReading, setEditingReading] = useState<GlucoseReading | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const handleEdit = (reading: GlucoseReading) => {
    setEditingReading(reading)
    setIsEditModalOpen(true)
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Filters */}
        <TableFilters currentFilter={currentFilter} onFilterChange={onFilterChange} />

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data / Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contexto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Glicemia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Observações
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {readings.map((reading) => {
                const status = getGlucoseStatus(reading.reading_value, reading.condition)
                const [year, month, day] = reading.reading_date.split("-")
                const formattedDate = `${day}/${month}/${year}`
                const formattedTime = reading.reading_time.slice(0, 5)

                return (
                  <tr key={reading.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{formattedDate}</div>
                      <div className="text-sm text-gray-500">{formattedTime}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getConditionIcon(reading.condition)}
                        <span className="text-sm text-gray-900">
                          {getConditionLabel(reading.condition, reading.reading_time)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">{reading.reading_value} mg/dL</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(status)}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 max-w-xs truncate">{reading.observations || "-"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(reading)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <DeleteReadingButton readingId={reading.id} onDataChange={onDataChange} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={15}
          onPageChange={onPageChange}
        />
      </div>

      <EditarRegistroModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        reading={editingReading}
        onDataChange={onDataChange}
      />
    </>
  )
}
