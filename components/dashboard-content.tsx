"use client"

import { useState, useCallback, useMemo } from "react"
import { useQueryClient } from "@tanstack/react-query"
import dynamic from "next/dynamic"
import { GlucoseTable } from "@/components/glucose-table"
import { GlucoseStats } from "@/components/glucose-stats"
import { DashboardClient } from "@/components/dashboard-client"
import { MedicacoesWidget } from "@/components/medicacoes-widget"
import { MedicalCalendar } from "@/components/medical-calendar"
// import { useGlucoseData } from "@/hooks/use-glucose-data" // Refactored
import { useSubscribeToGlucose, GLUCOSE_KEYS } from "@/hooks/use-glucose"
import {
  useGlucoseUnified,
  type UnifiedOptions,
} from "@/hooks/use-glucose-unified"
import { useUserProfile } from "@/hooks/use-user-profile"
import type { GlucoseReading } from "@/lib/types"
import { format, parseISO, subDays, isAfter } from "date-fns"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FoodStatsWidget } from "@/components/food-stats-widget"
import { ChartSkeleton } from "@/components/ui/skeletons"

// Lazy Loading Components
const GlucoseChart = dynamic(() => import("@/components/glucose-chart").then(mod => mod.GlucoseChart), {
  loading: () => <ChartSkeleton />,
  ssr: false
})

const VariabilityDashboard = dynamic(() => import("@/components/variability-dashboard").then(mod => mod.VariabilityDashboard), {
  loading: () => <div className="h-96 w-full flex items-center justify-center"><ChartSkeleton /></div>,
  ssr: false
})

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

  // Subscribe to Realtime Changes
  useSubscribeToGlucose(userId)

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

  // Fetch Logic: Unified Hook
  const {
    readings: paginatedReadings,
    pagination,
    chartData: allFetchedReadings,
    stats,
    isLoading
  } = useGlucoseUnified({
    userId,
    page,
    limit: ITEMS_PER_PAGE,
    filter,
    startDate,
    endDate,
    periodFilter,
    tagFilter,
    sortOrder,
    includeChartData: true,
    chartDays: filter === 'custom' ? undefined : 90
  })

  // Fetch User Preferences (Limits) using Hook
  const { data: userProfile } = useUserProfile(userId)
  const glucoseLimits = userProfile?.glucose_limits

  // TABLE DATA LOGIC
  const processedData = useMemo(() => {
    let currentReadings: GlucoseReading[] = []
    let totalPages = 0
    let totalItems = 0

    if (viewMode === "medical") {
      // Logic for Medical View (Client-side filtering/pagination on full dataset 'allFetchedReadings')
      let filteredForMedical = [...(allFetchedReadings || [])]

      // Filter Logic
      // Note: Unified Hook filters chartData by Date Range ONLY. 
      // We need to re-apply UI filters (today/7days specific logic inside 90day pool) and other filters.

      if (filter !== "custom" && filter !== "90days") {
        const now = new Date()
        let daysToSub = 90
        if (filter === "7days") daysToSub = 7
        if (filter === "today") daysToSub = 1
        if (filter === "30days") daysToSub = 30

        if (filter === "today") {
          const todayStr = now.toISOString().split("T")[0]
          filteredForMedical = filteredForMedical.filter((r: GlucoseReading) => r.reading_date === todayStr)
        } else {
          const cutoffDate = subDays(now, daysToSub)
          filteredForMedical = filteredForMedical.filter((r: GlucoseReading) => {
            const rDate = parseISO(r.reading_date)
            return isAfter(rDate, cutoffDate)
          })
        }
      }

      // Re-apply Period and Tag filters for Medical View
      if (periodFilter !== "all") {
        if (periodFilter === "morning") {
          filteredForMedical = filteredForMedical.filter(r => r.reading_time >= "06:00:00" && r.reading_time < "12:00:00")
        } else if (periodFilter === "afternoon") {
          filteredForMedical = filteredForMedical.filter(r => r.reading_time >= "12:00:00" && r.reading_time < "18:00:00")
        } else if (periodFilter === "night") {
          filteredForMedical = filteredForMedical.filter(r => r.reading_time >= "18:00:00" || r.reading_time < "06:00:00")
        }
      }

      if (tagFilter !== "all") {
        if (tagFilter === "insulin") filteredForMedical = filteredForMedical.filter(r => r.observations?.toLowerCase().includes("insulina") || false)
        if (tagFilter === "hypo") filteredForMedical = filteredForMedical.filter(r => r.reading_value < 70)
        if (tagFilter === "hyper") filteredForMedical = filteredForMedical.filter(r => r.reading_value > 180)
      }

      // Sort
      const sorted = [...filteredForMedical].sort((a, b) => {
        const dateA = a.reading_date + a.reading_time
        const dateB = b.reading_date + b.reading_time
        return sortOrder === "asc" ? dateA.localeCompare(dateB) : dateB.localeCompare(dateA)
      })

      // Pagination (Client-side)
      const uniqueDates = Array.from(new Set(sorted.map(r => r.reading_date)))
      totalItems = uniqueDates.length
      totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)

      const startIdx = (page - 1) * ITEMS_PER_PAGE
      const pageDates = uniqueDates.slice(startIdx, startIdx + ITEMS_PER_PAGE)
      currentReadings = sorted.filter((r: GlucoseReading) => pageDates.includes(r.reading_date))
    } else {
      // Standard View: Use Server-side paginated data from Hook
      currentReadings = paginatedReadings
      totalItems = pagination?.total || 0
      totalPages = pagination?.totalPages || 0
    }

    // CHART DATA LOGIC
    // Apply visual filters (period/tag) to chart data as well for consistency
    let chartReadingsFiltered = [...(allFetchedReadings || [])]

    if (periodFilter !== "all") {
      if (periodFilter === "morning") {
        chartReadingsFiltered = chartReadingsFiltered.filter(r => r.reading_time >= "06:00:00" && r.reading_time < "12:00:00")
      } else if (periodFilter === "afternoon") {
        chartReadingsFiltered = chartReadingsFiltered.filter(r => r.reading_time >= "12:00:00" && r.reading_time < "18:00:00")
      } else if (periodFilter === "night") {
        chartReadingsFiltered = chartReadingsFiltered.filter(r => r.reading_time >= "18:00:00" || r.reading_time < "06:00:00")
      }
    }
    if (tagFilter !== "all") {
      if (tagFilter === "insulin") chartReadingsFiltered = chartReadingsFiltered.filter(r => r.observations?.toLowerCase().includes("insulina") || false)
      if (tagFilter === "hypo") chartReadingsFiltered = chartReadingsFiltered.filter(r => r.reading_value < 70)
      if (tagFilter === "hyper") chartReadingsFiltered = chartReadingsFiltered.filter(r => r.reading_value > 180)
    }

    const chartReadings = chartReadingsFiltered.sort((a, b) => {
      const dateA = a.reading_date + a.reading_time
      const dateB = b.reading_date + b.reading_time
      return dateA.localeCompare(dateB)
    })

    // QUICK VIEW
    const last5Readings = [...chartReadingsFiltered].sort((a, b) => {
      const dateA = a.reading_date + a.reading_time
      const dateB = b.reading_date + b.reading_time
      return dateB.localeCompare(dateA)
    }).slice(0, 5)

    return {
      readings: currentReadings,
      chartReadings,
      last5Readings,
      totalPages,
      totalItems
    }
  }, [allFetchedReadings, paginatedReadings, pagination, filter, viewMode, page, sortOrder, ITEMS_PER_PAGE, periodFilter, tagFilter])

  const { readings, chartReadings, last5Readings, totalPages, totalItems } = processedData

  // Handlers
  const handleDataChange = useCallback(async () => {
    // Smart invalidation for new unified hooks
    await queryClient.invalidateQueries({ queryKey: ['glucose', 'table'] })
    await queryClient.invalidateQueries({ queryKey: ['glucose', 'chart-stats'] })
    // Legacy invalidation just in case other components use old hooks
    await queryClient.invalidateQueries({ queryKey: GLUCOSE_KEYS.lists() })
    setStatsKey((prev: number) => prev + 1)
  }, [queryClient, setStatsKey])

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. Header Section */}
      <section className="space-y-2">
        <h1 className="text-3xl font-bold font-display tracking-tight">Painel de Vida</h1>
        <p className="text-muted-foreground">Visão geral e monitoramento dos seus níveis de glicose.</p>
      </section>

      {/* 2. Action Bar */}
      <section>
        <DashboardClient userId={userId} onDataChange={handleDataChange} sortOrder={sortOrder} />
      </section>

      {/* 3. Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-8">
        <TabsList className="bg-muted/50 p-1 rounded-xl w-full justify-start h-auto">
          <TabsTrigger value="overview" className="rounded-lg py-2 px-4">Visão Geral</TabsTrigger>
          <TabsTrigger value="advanced" className="rounded-lg py-2 px-4">Análise Avançada e Atividades</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-12 animate-in fade-in-50">

          {/* Block A: KPI Stats */}
          <section>
            <GlucoseStats userId={userId} refreshKey={statsKey} preCalculatedStats={stats} />
          </section>

          {/* Block B: Main Chart (Lazy Loaded) */}
          <section>
            <GlucoseChart readings={chartReadings} limits={glucoseLimits} />
          </section>

          {/* Block C: Widgets Grid (Food, Recent Readings, Calendar) */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div key="left-column" className="lg:col-span-2 space-y-8">
              {/* Food Stats */}
              <FoodStatsWidget key="food-stats" userId={userId} filter={filter} startDate={startDate} endDate={endDate} />

              {/* Recent Readings Card */}
              <div key="recent-readings" className="bg-card rounded-xl border shadow-sm p-6">
                <h3 className="font-semibold text-lg mb-4">Últimas Leituras</h3>
                <div className="space-y-3">
                  {last5Readings.length === 0 ? (
                    <p className="text-muted-foreground text-sm">Nenhuma leitura recente.</p>
                  ) : (
                    last5Readings.map((reading, index) => (
                      <div key={reading.id || index} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg border">
                        <div>
                          <p className="font-bold text-lg">{reading.reading_value} <span className="text-xs font-normal text-muted-foreground">mg/dL</span></p>
                          <p className="text-xs text-muted-foreground capitalize">{reading.condition.replace('_', ' ')} • {format(parseISO(reading.reading_date), "dd/MM")} {reading.reading_time.slice(0, 5)}</p>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${reading.reading_value > (glucoseLimits?.post_meal_max || 140) ? 'bg-red-500' :
                          reading.reading_value < (glucoseLimits?.hypo_limit || 70) ? 'bg-orange-500' : 'bg-green-500'
                          }`} />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Calendar */}
            <div key="right-column" className="space-y-8">
              <MedicalCalendar key="calendar" userId={userId} />
            </div>
          </section>

          {/* Block D: Continuous Medications (Full Width) */}
          <section>
            <MedicacoesWidget userId={userId} />
          </section>

          {/* Block E: Detailed Table */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Histórico Detalhado</h2>
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
          </section>

        </TabsContent>

        <TabsContent value="advanced" className="animate-in fade-in-50">
          <VariabilityDashboard readings={chartReadings} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
