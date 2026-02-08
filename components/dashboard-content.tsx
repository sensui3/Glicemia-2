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
import { useGlucoseReadings, useGlucoseReadingsPaginated, useSubscribeToGlucose, GLUCOSE_KEYS } from "@/hooks/use-glucose"
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

  // Fetch Logic: Always fetch at least 90 days to populate the chart history, unless custom range is selected.
  const fetchFilter = filter === "custom" ? "custom" : "90days"

  // Fetch Summary Data (90 days) for Chart and Stats
  const { data: allFetchedReadings = [], isLoading: isChartLoading } = useGlucoseReadings({
    userId,
    filter: fetchFilter,
    startDate,
    endDate,
    periodFilter,
    tagFilter,
  })

  // Fetch Paginated Data for Table (Server-side)
  const { data: paginatedResponse, isLoading: isTableLoading } = useGlucoseReadingsPaginated({
    userId,
    page,
    limit: ITEMS_PER_PAGE,
    filter,
    periodFilter,
    tagFilter,
    startDate,
    endDate,
    sortBy: 'reading_date',
    sortOrder,
  })

  const isLoading = isChartLoading || isTableLoading

  // Fetch User Preferences (Limits) using Hook
  const { data: userProfile } = useUserProfile(userId)
  const glucoseLimits = userProfile?.glucose_limits

  // TABLE DATA LOGIC
  const processedData = useMemo(() => {
    let currentReadings: GlucoseReading[] = []
    let totalPages = 0
    let totalItems = 0

    if (viewMode === "medical") {
      // In Medical View, we still use client-side logic from the 90-day pool
      // because server-side date grouping with pagination is complex.
      // 1. Filter by UI Filter
      let filteredForMedical = [...allFetchedReadings]
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

      const sorted = [...filteredForMedical].sort((a, b) => {
        const dateA = a.reading_date + a.reading_time
        const dateB = b.reading_date + b.reading_time
        return sortOrder === "asc" ? dateA.localeCompare(dateB) : dateB.localeCompare(dateA)
      })

      const uniqueDates = Array.from(new Set(sorted.map(r => r.reading_date)))
      totalItems = uniqueDates.length
      totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)

      const startIdx = (page - 1) * ITEMS_PER_PAGE
      const pageDates = uniqueDates.slice(startIdx, startIdx + ITEMS_PER_PAGE)
      currentReadings = sorted.filter((r: GlucoseReading) => pageDates.includes(r.reading_date))
    } else {
      // Standard View: Use the precision server-side paginated data
      currentReadings = paginatedResponse?.data || []
      totalItems = paginatedResponse?.pagination.total || 0
      totalPages = paginatedResponse?.pagination.totalPages || 0
    }

    // CHART DATA: Always use up to 90 days pool
    const chartReadings = [...allFetchedReadings].sort((a, b) => {
      const dateA = a.reading_date + a.reading_time
      const dateB = b.reading_date + b.reading_time
      return dateA.localeCompare(dateB)
    })

    // QUICK VIEW: Last 5 readings
    const last5Readings = [...allFetchedReadings].sort((a, b) => {
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
  }, [allFetchedReadings, paginatedResponse, filter, viewMode, page, sortOrder, ITEMS_PER_PAGE])

  const { readings, chartReadings, last5Readings, totalPages, totalItems } = processedData

  // Handlers
  const handleDataChange = useCallback(async () => {
    // Smart invalidation
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
            <GlucoseStats userId={userId} refreshKey={statsKey} />
          </section>

          {/* Block B: Main Chart (Lazy Loaded) */}
          <section>
            <GlucoseChart readings={chartReadings} limits={glucoseLimits} />
          </section>

          {/* Block C: Widgets Grid (Food, Recent Readings, Calendar) */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-8">
              {/* Food Stats */}
              <FoodStatsWidget userId={userId} filter={fetchFilter} startDate={startDate} endDate={endDate} />

              {/* Recent Readings Card */}
              <div className="bg-card rounded-xl border shadow-sm p-6">
                <h3 className="font-semibold text-lg mb-4">Últimas Leituras</h3>
                <div className="space-y-3">
                  {last5Readings.length === 0 ? (
                    <p className="text-muted-foreground text-sm">Nenhuma leitura recente.</p>
                  ) : (
                    last5Readings.map((reading) => (
                      <div key={reading.id} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg border">
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
            <div className="space-y-8">
              <MedicalCalendar userId={userId} />
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
