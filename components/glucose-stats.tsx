"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { TrendingUp, TrendingDown, Activity } from "lucide-react"

type Props = {
  userId: string
  refreshKey?: number
}

export function GlucoseStats({ userId, refreshKey }: Props) {
  const [average, setAverage] = useState(0)
  const [highest, setHighest] = useState<any>(null)
  const [lowest, setLowest] = useState<any>(null)
  const [trend, setTrend] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [userId, refreshKey])

  const loadStats = async () => {
    setLoading(true)
    const supabase = createClient()

    // Buscar últimos 7 dias
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: readings } = await supabase
      .from("glucose_readings")
      .select("*")
      .eq("user_id", userId)
      .gte("reading_date", sevenDaysAgo.toISOString().split("T")[0])
      .order("reading_date", { ascending: false })
      .order("reading_time", { ascending: false })

    const readingsArray = readings || []

    // Calcular média dos últimos 7 dias
    const avg =
      readingsArray.length > 0
        ? Math.round(readingsArray.reduce((sum, r) => sum + r.reading_value, 0) / readingsArray.length)
        : 0
    setAverage(avg)

    // Encontrar maior e menor leitura
    const high =
      readingsArray.length > 0
        ? readingsArray.reduce((max, r) => (r.reading_value > max.reading_value ? r : max))
        : null
    setHighest(high)

    const low =
      readingsArray.length > 0
        ? readingsArray.reduce((min, r) => (r.reading_value < min.reading_value ? r : min))
        : null
    setLowest(low)

    // Calcular tendência (comparar última semana com semana anterior)
    const previousWeekStart = new Date(sevenDaysAgo)
    previousWeekStart.setDate(previousWeekStart.getDate() - 7)

    const { data: previousReadings } = await supabase
      .from("glucose_readings")
      .select("reading_value")
      .eq("user_id", userId)
      .gte("reading_date", previousWeekStart.toISOString().split("T")[0])
      .lt("reading_date", sevenDaysAgo.toISOString().split("T")[0])

    const previousAverage =
      previousReadings && previousReadings.length > 0
        ? previousReadings.reduce((sum, r) => sum + r.reading_value, 0) / previousReadings.length
        : 0

    const calculatedTrend = previousAverage > 0 ? Math.round(((avg - previousAverage) / previousAverage) * 100) : 0
    setTrend(calculatedTrend)

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-10 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Média */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">MÉDIA (7 DIAS)</span>
          <div className="bg-teal-100 p-2 rounded-lg">
            <Activity className="w-4 h-4 text-teal-700" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold">{average}</span>
          <span className="text-lg text-gray-500">mg/dL</span>
        </div>
        {trend !== 0 && (
          <div className={`flex items-center gap-1 mt-2 text-sm ${trend > 0 ? "text-red-600" : "text-green-600"}`}>
            {trend > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span>{Math.abs(trend)}% vs semana anterior</span>
          </div>
        )}
      </div>

      {/* Maior Leitura */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">MAIOR LEITURA</span>
          <div className="bg-red-100 p-2 rounded-lg">
            <TrendingUp className="w-4 h-4 text-red-700" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold">{highest?.reading_value || 0}</span>
          <span className="text-lg text-gray-500">mg/dL</span>
        </div>
        {highest && (
          <p className="text-sm text-gray-500 mt-2">
            Registrado {highest.reading_time ? `às ${highest.reading_time.slice(0, 5)}` : "hoje"}
          </p>
        )}
      </div>

      {/* Menor Leitura */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">MENOR LEITURA</span>
          <div className="bg-yellow-100 p-2 rounded-lg">
            <TrendingDown className="w-4 h-4 text-yellow-700" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold">{lowest?.reading_value || 0}</span>
          <span className="text-lg text-gray-500">mg/dL</span>
        </div>
        {lowest && (
          <p className="text-sm text-gray-500 mt-2">
            Registrado hoje às {lowest.reading_time ? lowest.reading_time.slice(0, 5) : "--:--"}
          </p>
        )}
      </div>
    </div>
  )
}
