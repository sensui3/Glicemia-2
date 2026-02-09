"use client"

import { type GlucoseReading, type GlucoseStatus, getGlucoseStatus, type GlucoseLimits } from "@/lib/types"
import { Utensils, Moon, Coffee, MoreHorizontal, Pencil, LayoutList, Grid3X3, ArrowDownAZ, ArrowUpAZ } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TablePagination } from "@/components/table-pagination"
import { TableFilters } from "@/components/table-filters"
import { useState } from "react"
import { EditarRegistroModal } from "@/components/editar-registro-modal"
import { DeleteReadingButton } from "@/components/delete-reading-button"
import { GlucoseTableMedical } from "@/components/glucose-table-medical"

type Props = {
  readings: GlucoseReading[]
  totalPages: number
  totalItems: number
  currentPage: number
  currentFilter: string
  onFilterChange: (filter: string, startDate?: string, endDate?: string) => void
  onPageChange: (page: number) => void
  onDataChange: () => void
  viewMode: "standard" | "medical"
  onViewModeChange: (mode: "standard" | "medical") => void
  sortOrder: "asc" | "desc"
  onSortChange: (order: "asc" | "desc") => void
  periodFilter: string
  onPeriodFilterChange: (period: string) => void
  tagFilter: string
  onTagFilterChange: (tag: string) => void
  limits?: GlucoseLimits
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
        if (hour >= 10 && hour < 14) return "Antes do Almoço"
        if (hour >= 14 && hour < 19) return "Antes do Lanche"
        if (hour >= 19 || hour < 5) return "Antes do Jantar"
        // Fallback
        return "Antes Ref."
      }
      return "Antes Ref."
    }
    case "apos_refeicao": {
      if (time) {
        const hour = Number.parseInt(time.split(":")[0])
        if (hour >= 5 && hour < 12) return "Após Café da Manhã"
        if (hour >= 12 && hour < 16) return "Após Almoço"
        if (hour >= 16 && hour < 19) return "Após Lanche"
        if (hour >= 19 || hour < 5) return "Após Jantar"
        // Fallback
        return "Após Ref."
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
    normal: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    alto: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    baixo: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    atencao: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
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

import { memo } from "react"

const TableRow = memo(function TableRow({
  reading,
  onEdit,
  onDelete,
  limits
}: {
  reading: GlucoseReading
  onEdit: (r: GlucoseReading) => void
  onDelete: () => void
  limits?: GlucoseLimits
}) {
  const status = getGlucoseStatus(reading.reading_value, reading.condition, limits)
  const [year, month, day] = reading.reading_date.split("-")
  const formattedDate = `${day}/${month}/${year}`
  const formattedTime = reading.reading_time.slice(0, 5)

  return (
    <tr className="hover:bg-muted/50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-foreground">{formattedDate}</div>
        <div className="text-sm text-muted-foreground">{formattedTime}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          {getConditionIcon(reading.condition)}
          <span className="text-sm text-foreground">
            {getConditionLabel(reading.condition, reading.reading_time)}
          </span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-bold text-foreground">{reading.reading_value} mg/dL</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(status)}</td>
      <td className="px-6 py-4">
        <div className="text-sm text-muted-foreground max-w-xs truncate">{reading.observations || "-"}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="icon" onClick={() => onEdit(reading)} aria-label="Editar registro">
            <Pencil className="w-4 h-4" />
          </Button>
          <DeleteReadingButton readingId={reading.id} onDataChange={onDelete} />
        </div>
      </td>
    </tr>
  )
})

export function GlucoseTable({
  // ... (existing props)
  readings,
  totalPages,
  totalItems,
  currentPage,
  currentFilter,
  onFilterChange,
  onPageChange,
  onDataChange,
  viewMode,
  onViewModeChange,
  sortOrder,
  onSortChange,
  periodFilter,
  onPeriodFilterChange,
  tagFilter,
  onTagFilterChange,
  limits,
}: Props) {
  // ... (existing state)
  const [editingReading, setEditingReading] = useState<GlucoseReading | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const handleEdit = (reading: GlucoseReading) => {
    setEditingReading(reading)
    setIsEditModalOpen(true)
  }

  // ... (render)

  // Inside map:
  // const status = getGlucoseStatus(reading.reading_value, reading.condition, limits)

  return (
    <>
      <div className="bg-card rounded-xl shadow-sm overflow-hidden border border-border">
        {/* ... (filters) */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 border-b border-border">
          {/* ... (TableFilters and buttons) */}
          <TableFilters
            currentFilter={currentFilter}
            onFilterChange={onFilterChange}
            periodFilter={periodFilter}
            onPeriodFilterChange={onPeriodFilterChange}
            tagFilter={tagFilter}
            onTagFilterChange={onTagFilterChange}
          />
          <div className="flex items-center gap-2">
            {/* ... (Sort buttons) */}
            <div className="flex items-center bg-muted p-1 rounded-lg">
              <button
                onClick={() => onSortChange("desc")}
                className={`p-2 rounded-md transition-all ${sortOrder === "desc"
                  ? "bg-background text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
                title="Mais Recentes Primeiro"
                aria-label="Mais Recentes Primeiro"
              >
                <ArrowDownAZ className="w-4 h-4" />
              </button>
              <button
                onClick={() => onSortChange("asc")}
                className={`p-2 rounded-md transition-all ${sortOrder === "asc"
                  ? "bg-background text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
                title="Mais Antigos Primeiro"
                aria-label="Mais Antigos Primeiro"
              >
                <ArrowUpAZ className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center bg-muted p-1 rounded-lg">
              <button
                onClick={() => onViewModeChange("standard")}
                className={`p-2 rounded-md transition-all ${viewMode === "standard"
                  ? "bg-background text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
                title="Visualização em Lista"
                aria-label="Visualização em Lista"
              >
                <LayoutList className="w-4 h-4" />
              </button>
              <button
                onClick={() => onViewModeChange("medical")}
                className={`p-2 rounded-md transition-all ${viewMode === "medical"
                  ? "bg-background text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
                title="Visualização Médica"
                aria-label="Visualização Médica"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        {viewMode === "standard" ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Data / Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Contexto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Glicemia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Observações
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {readings.map((reading) => (
                  <TableRow
                    key={reading.id}
                    reading={reading}
                    onEdit={handleEdit}
                    onDelete={onDataChange}
                    limits={limits}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <GlucoseTableMedical readings={readings} sortOrder={sortOrder} limits={limits} />
        )}

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
