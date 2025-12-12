"use client"

import { Button } from "@/components/ui/button"
import { useState } from "react"
import { FiltroPersonalizadoModal } from "@/components/filtro-personalizado-modal"

type Props = {
  currentFilter: string
  onFilterChange: (filter: string, startDate?: string, endDate?: string) => void
}

export function TableFilters({ currentFilter, onFilterChange }: Props) {
  const [isCustomFilterOpen, setIsCustomFilterOpen] = useState(false)

  const setFilter = (filter: string) => {
    if (filter === "custom") {
      setIsCustomFilterOpen(true)
      return
    }

    onFilterChange(filter)
  }

  const handleCustomFilter = (startDate: string, endDate: string) => {
    onFilterChange("custom", startDate, endDate)
    setIsCustomFilterOpen(false)
  }

  const filters = [
    { value: "today", label: "Hoje" },
    { value: "7days", label: "Últimos 7 Dias" },
    { value: "30days", label: "Mês Atual" },
    { value: "custom", label: "Personalizado" },
  ]

  return (
    <>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 flex-wrap">
          {filters.map((filter) => (
            <Button
              key={filter.value}
              variant={currentFilter === filter.value ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(filter.value)}
              className={currentFilter === filter.value ? "bg-teal-600 hover:bg-teal-700" : ""}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      <FiltroPersonalizadoModal
        open={isCustomFilterOpen}
        onOpenChange={setIsCustomFilterOpen}
        onConfirm={handleCustomFilter}
      />
    </>
  )
}
