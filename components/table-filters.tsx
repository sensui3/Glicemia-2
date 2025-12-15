"use client"

import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { FiltroPersonalizadoModal } from "@/components/filtro-personalizado-modal"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Filter, Clock, Syringe } from "lucide-react"

type Props = {
  currentFilter: string
  onFilterChange: (filter: string, startDate?: string, endDate?: string) => void
  periodFilter: string
  onPeriodFilterChange: (period: string) => void
  tagFilter: string
  onTagFilterChange: (tag: string) => void
}

export function TableFilters({
  currentFilter,
  onFilterChange,
  periodFilter,
  onPeriodFilterChange,
  tagFilter,
  onTagFilterChange
}: Props) {
  const [isCustomFilterOpen, setIsCustomFilterOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

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
    { value: "7days", label: "7 Dias" },
    { value: "30days", label: "30 Dias" },
    { value: "custom", label: "Personalizado" },
  ]

  if (!isMounted) {
    return (
      <div className="p-4 border-b border-border">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          {/* Skeleton/Placeholder to prevent layout shift */}
          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
            {filters.map((filter) => (
              <div key={filter.value} className="h-9 w-20 bg-muted rounded-md animate-pulse" />
            ))}
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="h-9 w-[140px] bg-muted rounded-md animate-pulse" />
            <div className="h-9 w-[140px] bg-muted rounded-md animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="p-4 border-b border-border">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">

          {/* Main Date Filters */}
          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
            {filters.map((filter) => (
              <Button
                key={filter.value}
                variant={currentFilter === filter.value ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(filter.value)}
                className={currentFilter === filter.value ? "bg-teal-600 hover:bg-teal-700 text-white" : ""}
              >
                {filter.label}
              </Button>
            ))}
          </div>

          {/* Advanced Filters */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Select value={periodFilter} onValueChange={onPeriodFilterChange}>
                <SelectTrigger className="w-full md:w-[140px] h-9 text-xs">
                  <Clock className="w-3 h-3 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Horários</SelectItem>
                  <SelectItem value="morning">Manhã (06-12)</SelectItem>
                  <SelectItem value="afternoon">Tarde (12-18)</SelectItem>
                  <SelectItem value="night">Noite (18-06)</SelectItem>
                </SelectContent>
              </Select>

              <Select value={tagFilter} onValueChange={onTagFilterChange}>
                <SelectTrigger className="w-full md:w-[140px] h-9 text-xs">
                  <Syringe className="w-3 h-3 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Tags" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas Tags</SelectItem>
                  <SelectItem value="insulin">Com Insulina</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
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
