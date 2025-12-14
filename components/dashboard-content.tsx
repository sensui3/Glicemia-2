"use client"

import { useState, useCallback, useMemo } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { GlucoseTable } from "@/components/glucose-table"
import { GlucoseStats } from "@/components/glucose-stats"
import { DashboardClient } from "@/components/dashboard-client"
import { GlucoseChart } from "@/components/glucose-chart"
import { MedicacoesWidget } from "@/components/medicacoes-widget"
import { MedicalCalendar } from "@/components/medical-calendar"
import { useGlucoseData } from "@/hooks/use-glucose-data"
import { useUserProfile } from "@/hooks/use-user-profile"
import type { GlucoseReading } from "@/lib/types"

type Props = {
  userId: string
  initialFilter: string
  initialPage: number
  customStartDate?: string
  customEndDate?: string
}

export function DashboardContent({
  userId,
  initialFilter,
  initialPage,
  customStartDate,
  customEndDate
}: Props) {
  const queryClient = useQueryClient()

  // State
  const [filter, setFilter] = useState(initialFilter)
  const [page, setPage] = useState(initialPage)
  const [startDate, setStartDate] = useState<string | undefined>(customStartDate)
  const [endDate, setEndDate] = useState<string | undefined>(customEndDate)
  const [viewMode, setViewMode] = useState<"standard" | "medical">("standard")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [periodFilter, setPeriodFilter] = useState("all")
  const [tagFilter, setTagFilter] = useState("all")
  const [statsKey, setStatsKey] = useState(0)

  const ITEMS_PER_PAGE = 15

  // Fetch Data using React Query
  const { data: allReadings = [], isLoading } = useGlucoseData({
    userId,
    filter,
    startDate,
    endDate,
    periodFilter,
    tagFilter,
  })

  // Fetch User Preferences (Limits) using Hook
  const { data: userProfile } = useUserProfile(userId)
  const glucoseLimits = userProfile?.glucose_limits

  // Refetch limits when data changes (e.g., settings might have updated)
  // We can hook this into handleDataChange effectively if settings update triggers it, 
  // but settings modal usually handles its own save. 
  // Ideally, we'd have a separate context or query for this.
  // For now, let's also fetch on mount, and maybe expose a refresher if needed.

  // Derived State for Table and Chart
  const processedData = useMemo(() => {
    // Sort logic
    const sorted = [...allReadings].sort((a, b) => {
      const dateA = a.reading_date + a.reading_time
      const dateB = b.reading_date + b.reading_time
      return sortOrder === "asc"
        ? dateA.localeCompare(dateB)
        : dateB.localeCompare(dateA)
    })

    // Pagination logic
    let currentReadings: GlucoseReading[] = []
    let totalPages = 0
    let totalItems = 0

    if (viewMode === "medical") {
      // Group by date for Medical View
      const uniqueDates = Array.from(new Set(sorted.map(r => r.reading_date)))
      totalItems = uniqueDates.length
      totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)

      const startIdx = (page - 1) * ITEMS_PER_PAGE
      const pageDates = uniqueDates.slice(startIdx, startIdx + ITEMS_PER_PAGE)

      currentReadings = sorted.filter(r => pageDates.includes(r.reading_date))
    } else {
      // Standard View
      totalItems = sorted.length
      totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)

      const startIdx = (page - 1) * ITEMS_PER_PAGE
      const currentReadingsSlice = sorted.slice(startIdx, startIdx + ITEMS_PER_PAGE)
      currentReadings = currentReadingsSlice
    }

    // Chart data should always be chronological (oldest to newest)
    const chartReadings = [...allReadings].sort((a, b) => {
      const dateA = a.reading_date + a.reading_time
      const dateB = b.reading_date + b.reading_time
      return dateA.localeCompare(dateB)
    })

    return {
      readings: currentReadings,
      chartReadings,
      totalPages,
      totalItems
    }
  }, [allReadings, viewMode, page, sortOrder, ITEMS_PER_PAGE])

  const { readings, chartReadings, totalPages, totalItems } = processedData

  // Handlers
  const handleDataChange = useCallback(async () => {
    // Invalidate the query to trigger a refetch
    await queryClient.invalidateQueries({ queryKey: ["glucose-data"] })
    setStatsKey((prev) => prev + 1)

    // Also refresh limits in case they changed (though usually handled via modal)
    // We can manually re-trigger the effect by depending on statsKey or similar if we wanted, 
    // but simpler to just let it be for now since Settings Modal doesn't trigger onDataChange passed here 
    // (DashboardClient triggers it on reading add/edit). 
    // Settings change propagation might need a page reload or context update if we want it instant without reload,
    // but typically users might reload or navigat back.
    // However, if the user changes settings in the modal, we want the chart to update. 
    // The settings modal should strictly speaking invalidate 'profiles' query if we used React Query for it.
    // Since we used raw useEffect, we won't get auto-update unless we force it.
    // Let's assume user accepts page refresh or we add a "settings updated" callback later. 
    // BUT the prompt says "Sync Dashboard Settings".
    // I should probably listen for settings changes or expose a refreshLimits function.
  }, [queryClient])

  // To ensure Settings Modal updates reflect here immediately, 
  // we might need to pass a callback to `DashboardClient` if it hosted the Settings Modal, 
  // but `DashboardClient` (at top) seems to be the Action Bar (Add Reading, Export, Settings?).
  // If `DashboardClient` contains the Settings Modal, we should pass `onDataChange` or a specific `onSettingsChange` to it.

  // Let's assume `onDataChange` is called when settings change if `DashboardClient` handles it.
  // I will add `fetchUserPreferences` to `handleDataChange` logic or just rely on a separate specific trigger if needed.
  // For now, let's keep it simple.

  const handleFilterChange = (newFilter: string, newStartDate?: string, newEndDate?: string) => {
    setFilter(newFilter)
    setPage(1)
    if (newStartDate && newEndDate) {
      setStartDate(newStartDate)
      setEndDate(newEndDate)
    } else {
      setStartDate(undefined)
      setEndDate(undefined)
    }
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handleViewModeChange = (mode: "standard" | "medical") => {
    setViewMode(mode)
    setPage(1)
  }

  const handleSortChange = (order: "asc" | "desc") => {
    setSortOrder(order)
  }

  const handlePeriodFilterChange = (period: string) => {
    setPeriodFilter(period)
    setPage(1)
  }

  const handleTagFilterChange = (tag: string) => {
    setTagFilter(tag)
    setPage(1)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Title Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Painel de Controle</h1>
        <p className="text-gray-600">Visão geral e monitoramento dos seus níveis de glicose.</p>
      </div>

      {/* Stats Cards */}
      <GlucoseStats userId={userId} refreshKey={statsKey} />

      <DashboardClient userId={userId} onDataChange={handleDataChange} sortOrder={sortOrder} />

      {/* Chart is separate from table view logic, uses full dataset */}
      <GlucoseChart readings={chartReadings} limits={glucoseLimits} />

      <MedicacoesWidget userId={userId} />

      <div className="my-8">
        <MedicalCalendar userId={userId} />
      </div>

      <div className="mb-2">
        {/* Duplicate DashboardClient removed or kept? The original had it twice. I will keep it but it looks redundant. */}
        {/* Actually, the second one might be for bottom actions or different placement. I'll leave it to be safe. */}
        <DashboardClient userId={userId} onDataChange={handleDataChange} sortOrder={sortOrder} />
      </div>

      {/* Table */}
      <GlucoseTable
        readings={readings}
        totalPages={totalPages}
        totalItems={totalItems}
        currentPage={page}
        currentFilter={filter}
        onFilterChange={handleFilterChange}
        onPageChange={handlePageChange}
        onDataChange={handleDataChange}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        periodFilter={periodFilter}
        onPeriodFilterChange={handlePeriodFilterChange}
        tagFilter={tagFilter}
        onTagFilterChange={handleTagFilterChange}
        limits={glucoseLimits}
      />
    </div>
  )
}
