"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { TrendingUp, TrendingDown, Activity, Percent } from "lucide-react"

type Props = {
  userId: string
  refreshKey?: number
}

export function GlucoseStats({ userId, refreshKey }: Props) {
  const [average, setAverage] = useState(0)
  const [highest, setHighest] = useState<any>(null)
  const [lowest, setLowest] = useState<any>(null)
  const [trend, setTrend] = useState(0)
  const [hba1c, setHba1c] = useState<string | number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [userId, refreshKey])

  const loadStats = async () => {
    setLoading(true)
    const supabase = createClient()

    const now = new Date()

    // Datas de corte
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(now.getDate() - 7)

    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(now.getDate() - 14)

    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(now.getDate() - 90)

    // Buscar dados dos últimos 90 dias (cobre todos os períodos necessários)
    const { data: readings } = await supabase
      .from("glucose_readings")
      .select("*")
      .eq("user_id", userId)
      .gte("reading_date", ninetyDaysAgo.toISOString().split("T")[0])
      .order("reading_date", { ascending: false })
      .order("reading_time", { ascending: false })

    const allReadings = readings || []

    // Filtrar dados para 7 dias (para Média, Alta, Baixa)
    const sevenDayReadings = allReadings.filter(r => new Date(r.reading_date) >= sevenDaysAgo)

    // Calcular média dos últimos 7 dias
    const avg =
      sevenDayReadings.length > 0
        ? Math.round(sevenDayReadings.reduce((sum, r) => sum + r.reading_value, 0) / sevenDayReadings.length)
        : 0
    setAverage(avg)

    // Encontrar maior e menor leitura (nos últimos 7 dias)
    const high =
      sevenDayReadings.length > 0
        ? sevenDayReadings.reduce((max, r) => (r.reading_value > max.reading_value ? r : max))
        : null
    setHighest(high)

    const low =
      sevenDayReadings.length > 0
        ? sevenDayReadings.reduce((min, r) => (r.reading_value < min.reading_value ? r : min))
        : null
    setLowest(low)

    // Calcular tendência (comparar última semana com semana anterior)
    const previousWeekReadings = allReadings.filter(r => {
      const d = new Date(r.reading_date)
      // Ajuste para pegar estritamente a semana anterior (entre 7 e 14 dias atrás)
      // Nota: A lógica original usava query date ranges. 
      // Comparando datas (yyyy-mm-dd) como strings ou objetos Date.
      // Simplificação usando comparação de data.
      return d >= fourteenDaysAgo && d < sevenDaysAgo
    })

    const previousAverage =
      previousWeekReadings.length > 0
        ? previousWeekReadings.reduce((sum, r) => sum + r.reading_value, 0) / previousWeekReadings.length
        : 0

    const calculatedTrend = previousAverage > 0 ? Math.round(((avg - previousAverage) / previousAverage) * 100) : 0
    setTrend(calculatedTrend)

    // Calcular HbA1c estimada (baseada em 90 dias se disponível, ou o que tiver)
    // Formula: (Média + 46.7) / 28.7
    const avg90 =
      allReadings.length > 0
        ? allReadings.reduce((sum, r) => sum + r.reading_value, 0) / allReadings.length
        : 0

    const estimatedA1c = avg90 > 0 ? ((avg90 + 46.7) / 28.7).toFixed(1) : 0
    setHba1c(estimatedA1c)

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-10 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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

      {/* HbA1c Estimada */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">HbA1c ESTIMADA</span>
          <div className="bg-purple-100 p-2 rounded-lg">
            <Percent className="w-4 h-4 text-purple-700" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold">{hba1c}</span>
          <span className="text-lg text-gray-500">%</span>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Baseado nos últimos 90 dias
        </p>
      </div>

      {/* Maior Leitura */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">MAIOR (7 DIAS)</span>
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
          <span className="text-sm font-medium text-gray-600">MENOR (7 DIAS)</span>
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
            Registrado {lowest.reading_time ? lowest.reading_time.slice(0, 5) : "--:--"}
          </p>
        )}
      </div>
    </div>
  )
}
