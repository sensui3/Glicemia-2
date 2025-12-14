"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { GlucoseTable } from "@/components/glucose-table"
import { GlucoseStats } from "@/components/glucose-stats"
import { DashboardClient } from "@/components/dashboard-client"
import { GlucoseChart } from "@/components/glucose-chart"
import { MedicacoesWidget } from "@/components/medicacoes-widget"
import { MedicalCalendar } from "@/components/medical-calendar"
import type { GlucoseReading } from "@/lib/types"

type Props = {
  userId: string
  initialFilter: string
  initialPage: number
  customStartDate?: string
  customEndDate?: string
}

export function DashboardContent({ userId, initialFilter, initialPage, customStartDate, customEndDate }: Props) {
  const [filter, setFilter] = useState(initialFilter)
  const [page, setPage] = useState(initialPage)
  const [startDate, setStartDate] = useState<string | undefined>(customStartDate)
  const [endDate, setEndDate] = useState<string | undefined>(customEndDate)
  const [readings, setReadings] = useState<GlucoseReading[]>([])
  const [chartReadings, setChartReadings] = useState<GlucoseReading[]>([])
  const [totalPages, setTotalPages] = useState(0)
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(false)
  const [statsKey, setStatsKey] = useState(0)
  const [viewMode, setViewMode] = useState<"standard" | "medical">("standard")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [periodFilter, setPeriodFilter] = useState("all")
  const [tagFilter, setTagFilter] = useState("all")

  const ITEMS_PER_PAGE = 15

  useEffect(() => {
    loadData()
  }, [filter, page, startDate, endDate, userId, viewMode, sortOrder, periodFilter, tagFilter])

  const loadData = async () => {
    setLoading(true)
    const supabase = createClient()

    let queryStartDate: string
    let queryEndDate: string = new Date().toISOString().split("T")[0]

    if (filter === "custom" && startDate && endDate) {
      queryStartDate = startDate
      queryEndDate = endDate
    } else {
      const date = new Date()
      switch (filter) {
        case "today":
          queryStartDate = date.toISOString().split("T")[0]
          break
        case "7days":
          date.setDate(date.getDate() - 7)
          queryStartDate = date.toISOString().split("T")[0]
          break
        case "30days":
          date.setDate(date.getDate() - 30)
          queryStartDate = date.toISOString().split("T")[0]
          break
        default:
          date.setDate(date.getDate() - 7)
          queryStartDate = date.toISOString().split("T")[0]
      }
    }

    // Helper to apply advanced filters
    const applyAdvancedFilters = (query: any) => {
      if (periodFilter === "morning") {
        query = query.gte("reading_time", "06:00:00").lt("reading_time", "12:00:00")
      } else if (periodFilter === "afternoon") {
        query = query.gte("reading_time", "12:00:00").lt("reading_time", "18:00:00")
      } else if (periodFilter === "night") {
        query = query.or("reading_time.gte.18:00:00,reading_time.lt.06:00:00")
      }

      if (tagFilter === "insulin") {
        query = query.ilike("observations", "%insulina%")
      }
      return query
    }

    if (viewMode === "medical") {
      // Logic for Medical View: Pagination by Day
      // 1. Get all dates in range
      // IMPORTANT: We must apply filters here too, otherwise we might get pages with no matching readings
      let dateQuery = supabase
        .from("glucose_readings")
        .select("reading_date")
        .eq("user_id", userId)
        .gte("reading_date", queryStartDate)
        .lte("reading_date", queryEndDate)

      dateQuery = applyAdvancedFilters(dateQuery)

      const { data: allDatesData } = await dateQuery.order("reading_date", { ascending: sortOrder === "asc" })

      const uniqueDates = Array.from(new Set((allDatesData || []).map(d => d.reading_date)))

      const count = uniqueDates.length
      setTotalPages(Math.ceil(count / ITEMS_PER_PAGE))
      setTotalItems(count)

      // 2. Slice dates for current page
      const startIdx = (page - 1) * ITEMS_PER_PAGE
      const pageDates = uniqueDates.slice(startIdx, startIdx + ITEMS_PER_PAGE)

      if (pageDates.length > 0) {
        // 3. Fetch readings for these dates
        let readingsQuery = supabase
          .from("glucose_readings")
          .select("*")
          .eq("user_id", userId)
          .in("reading_date", pageDates)

        readingsQuery = applyAdvancedFilters(readingsQuery)

        const { data: readingsData } = await readingsQuery
          .order("reading_date", { ascending: sortOrder === "asc" })
          .order("reading_time", { ascending: sortOrder === "asc" })

        setReadings((readingsData || []) as GlucoseReading[])
      } else {
        setReadings([])
      }

    } else {
      // Standard Logic: Pagination by Reading
      let countQuery = supabase
        .from("glucose_readings")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("reading_date", queryStartDate)
        .lte("reading_date", queryEndDate)

      countQuery = applyAdvancedFilters(countQuery)

      const { count } = await countQuery

      setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE))
      setTotalItems(count || 0)

      let dataQuery = supabase
        .from("glucose_readings")
        .select("*")
        .eq("user_id", userId)
        .gte("reading_date", queryStartDate)
        .lte("reading_date", queryEndDate)

      dataQuery = applyAdvancedFilters(dataQuery)

      const { data: readingsData } = await dataQuery
        .order("reading_date", { ascending: sortOrder === "asc" })
        .order("reading_time", { ascending: sortOrder === "asc" })
        .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1)

      setReadings((readingsData || []) as GlucoseReading[])
    }

    // Chart data
    let chartQuery = supabase
      .from("glucose_readings")
      .select("*")
      .eq("user_id", userId)
      .gte("reading_date", queryStartDate)
      .lte("reading_date", queryEndDate)

    chartQuery = applyAdvancedFilters(chartQuery)

    const { data: allReadingsForChart } = await chartQuery
      .order("reading_date", { ascending: true })
      .order("reading_time", { ascending: true })

    setChartReadings((allReadingsForChart || []) as GlucoseReading[])
    setLoading(false)
    setStatsKey((prev) => prev + 1)
  }

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
    setPage(1) // Reset page when switching views to avoid page out of bounds
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

  const handleDataChange = () => {
    loadData()
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

      <GlucoseChart readings={chartReadings} />

      <MedicacoesWidget userId={userId} />

      <div className="my-8">
        <MedicalCalendar userId={userId} />
      </div>

      <div className="mb-2">
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
      />
    </div>
  )
}
