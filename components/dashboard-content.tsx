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

  const ITEMS_PER_PAGE = 15

  useEffect(() => {
    loadData()
  }, [filter, page, startDate, endDate, userId])

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

    const { count } = await supabase
      .from("glucose_readings")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("reading_date", queryStartDate)
      .lte("reading_date", queryEndDate)

    setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE))
    setTotalItems(count || 0)

    const { data: readingsData } = await supabase
      .from("glucose_readings")
      .select("*")
      .eq("user_id", userId)
      .gte("reading_date", queryStartDate)
      .lte("reading_date", queryEndDate)
      .order("reading_date", { ascending: false })
      .order("reading_time", { ascending: false })
      .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1)

    setReadings((readingsData || []) as GlucoseReading[])

    const { data: allReadingsForChart } = await supabase
      .from("glucose_readings")
      .select("*")
      .eq("user_id", userId)
      .gte("reading_date", queryStartDate)
      .lte("reading_date", queryEndDate)
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

      <DashboardClient userId={userId} onDataChange={handleDataChange} />

      <GlucoseChart readings={chartReadings} />

      <MedicacoesWidget userId={userId} />

      <div className="my-8">
        <MedicalCalendar userId={userId} />
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
      />
    </div>
  )
}
