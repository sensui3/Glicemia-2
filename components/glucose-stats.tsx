"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { createClient } from "@/lib/supabase/client"
import { TrendingUp, TrendingDown, Activity, Percent, Info, Target } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { GlucoseReading } from "@/lib/types"
import type { GlucoseStatsData } from "@/hooks/use-glucose-unified"
import type { Hba1cPoint } from "@/components/hba1c-chart"

// Lazy-load do gráfico HbA1c — Recharts só carrega quando o dialog abre
const Hba1cChart = dynamic(
  () => import("@/components/hba1c-chart").then(mod => mod.Hba1cChart),
  {
    loading: () => (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="animate-pulse text-sm">Carregando gráfico...</div>
      </div>
    ),
    ssr: false
  }
)

type Props = {
  userId: string
  refreshKey?: number
  preCalculatedStats?: GlucoseStatsData
}

// Tipo Hba1cPoint importado de @/components/hba1c-chart

export function GlucoseStats({ userId, refreshKey, preCalculatedStats }: Props) {
  const [average, setAverage] = useState(0)
  const [highest, setHighest] = useState<any>(null)
  const [lowest, setLowest] = useState<any>(null)
  const [trend, setTrend] = useState(0)
  const [timeInRange, setTimeInRange] = useState(0)
  const [hba1c, setHba1c] = useState<string | number>(0)
  const [hba1cHistory, setHba1cHistory] = useState<Hba1cPoint[]>([])
  const [loading, setLoading] = useState(!preCalculatedStats)

  useEffect(() => {
    if (preCalculatedStats) {
      setLoading(false)
      return
    }
    void loadStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, refreshKey, preCalculatedStats])

  const loadStats = async () => {
    setLoading(true)
    const supabase = createClient()
    const now = new Date()

    // Datas de corte
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(now.getDate() - 7)
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(now.getDate() - 14)
    const oneEightyDaysAgo = new Date()
    oneEightyDaysAgo.setDate(now.getDate() - 180)
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(now.getDate() - 90)

    // Buscar dados dos últimos 180 dias para permitir trend line
    const { data: readings } = await supabase
      .from("glucose_readings")
      .select("*")
      .eq("user_id", userId)
      .gte("reading_date", oneEightyDaysAgo.toISOString().split("T")[0])
      .order("reading_date", { ascending: false })
      .order("reading_time", { ascending: false })

    const allReadings = readings || []

    // Filtrar dados para 7 dias (para Média, Alta, Baixa)
    const sevenDayReadings = allReadings.filter((r: GlucoseReading) => new Date(r.reading_date) >= sevenDaysAgo)

    const avg =
      sevenDayReadings.length > 0
        ? Math.round(sevenDayReadings.reduce((sum: number, r: GlucoseReading) => sum + r.reading_value, 0) / sevenDayReadings.length)
        : 0
    setAverage(avg)

    const inRange = sevenDayReadings.filter((r: GlucoseReading) => r.reading_value >= 70 && r.reading_value <= 180).length
    const total = sevenDayReadings.length
    const tir = total > 0 ? Math.round((inRange / total) * 100) : 0
    setTimeInRange(tir)

    const high =
      sevenDayReadings.length > 0
        ? sevenDayReadings.reduce((max: GlucoseReading, r: GlucoseReading) => (r.reading_value > max.reading_value ? r : max))
        : null
    setHighest(high)

    const low =
      sevenDayReadings.length > 0
        ? sevenDayReadings.reduce((min: GlucoseReading, r: GlucoseReading) => (r.reading_value < min.reading_value ? r : min))
        : null
    setLowest(low)

    // Calcular tendência (comparar última semana com semana anterior)
    const previousWeekReadings = allReadings.filter((r: GlucoseReading) => {
      const d = new Date(r.reading_date)
      return d >= fourteenDaysAgo && d < sevenDaysAgo
    })

    const previousAverage =
      previousWeekReadings.length > 0
        ? previousWeekReadings.reduce((sum: number, r: GlucoseReading) => sum + r.reading_value, 0) / previousWeekReadings.length
        : 0

    const calculatedTrend =
      previousAverage > 0 ? Math.round(((avg - previousAverage) / previousAverage) * 100) : 0
    setTrend(calculatedTrend)

    // Calcular HbA1c atual (baseada nos últimos 90 dias a partir de hoje)
    const currentReadings90 = allReadings.filter((r: GlucoseReading) => new Date(r.reading_date) >= ninetyDaysAgo)

    const avg90 =
      currentReadings90.length > 0
        ? currentReadings90.reduce((sum: number, r: GlucoseReading) => sum + r.reading_value, 0) / currentReadings90.length
        : 0

    const estimatedA1c = avg90 > 0 ? ((avg90 + 46.7) / 28.7).toFixed(1) : 0
    setHba1c(estimatedA1c)

    // Calcular histórico da HbA1c (pontos semanais para as últimas 12 semanas)
    const history: Hba1cPoint[] = []

    for (let i = 12; i >= 0; i--) {
      const refDate = new Date()
      refDate.setDate(refDate.getDate() - i * 7)

      const windowStart = new Date(refDate)
      windowStart.setDate(windowStart.getDate() - 90)

      const windowReadings = allReadings.filter((r: GlucoseReading) => {
        const d = new Date(r.reading_date)
        return d <= refDate && d >= windowStart
      })

      if (windowReadings.length > 0) {
        const wAvg = windowReadings.reduce((sum: number, r: GlucoseReading) => sum + r.reading_value, 0) / windowReadings.length
        const wA1c = (wAvg + 46.7) / 28.7
        history.push({
          date: refDate.toISOString().split("T")[0],
          value: Number(wA1c.toFixed(1)),
          formattedDate: format(refDate, "dd/MMM", { locale: ptBR }),
        })
      }
    }
    setHba1cHistory(history)
    setLoading(false)
  }

  const displayAverage = preCalculatedStats ? preCalculatedStats.average : average
  const displayHighestValue = preCalculatedStats ? preCalculatedStats.highest : highest?.reading_value
  const displayLowestValue = preCalculatedStats ? preCalculatedStats.lowest : lowest?.reading_value
  const displayHba1c = preCalculatedStats ? preCalculatedStats.hba1c : hba1c
  const displayTimeInRange = preCalculatedStats ? preCalculatedStats.timeInRange : timeInRange

  const displayHighestTime = preCalculatedStats ? null : highest?.reading_time ? `às ${highest.reading_time.slice(0, 5)}` : "hoje"
  const displayLowestTime = preCalculatedStats ? null : lowest?.reading_time ? lowest.reading_time.slice(0, 5) : "--:--"

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card rounded-xl p-6 shadow-sm animate-pulse">
            <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
            <div className="h-10 bg-muted rounded w-3/4"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Média */}
      <div className="bg-card rounded-xl p-6 shadow-sm border border-border border-l-4 border-l-teal-500 hover:shadow-md transition-all duration-300">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-muted-foreground tracking-widest font-display">MÉDIA (7 DIAS)</span>
          <div className="bg-teal-100 dark:bg-teal-900/30 p-2 rounded-lg">
            <Activity className="w-4 h-4 text-teal-700 dark:text-teal-400" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold font-display tracking-tight">{displayAverage}</span>
          <span className="text-lg text-muted-foreground">mg/dL</span>
        </div>
        {!preCalculatedStats && trend !== 0 && (
          <div
            className={`flex items-center gap-1 mt-2 text-sm ${trend > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}
          >
            {trend > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span>{Math.abs(trend)}% vs semana anterior</span>
          </div>
        )}
      </div>

      {/* HbA1c Estimada com Modal */}
      <Dialog>
        <DialogTrigger asChild>
          <div className="bg-card rounded-xl p-6 shadow-sm cursor-pointer transition-all hover:shadow-lg border border-border border-l-4 border-l-purple-500 hover:border-purple-200 dark:hover:border-purple-800 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-bl-full pointer-events-none" />
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors">
                HbA1c ESTIMADA
              </span>
              <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-800/50 transition-colors">
                <Percent className="w-4 h-4 text-purple-700 dark:text-purple-400" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold font-display tracking-tight">{displayHba1c}</span>
              <span className="text-lg text-muted-foreground">%</span>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400">
              <Info className="w-3 h-3" />
              <span>Ver histórico</span>
            </div>
          </div>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Histórico de HbA1c Estimada</DialogTitle>
            <DialogDescription>
              Acompanhamento da evolução da sua Hemoglobina Glicada estimada.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <div className="h-[300px] w-full">
              <Hba1cChart data={hba1cHistory} onLoadDetailed={loadStats} />
            </div>
            <div className="mt-4 text-sm text-muted-foreground bg-muted p-4 rounded-lg">
              <p className="font-semibold mb-1">Sobre este cálculo:</p>
              <p>
                A HbA1c estimada é calculada com base na média das suas leituras de glicose.
                Cada ponto no gráfico representa uma estimativa baseada nos 90 dias anteriores àquela data.
                Valores ideais para diabéticos geralmente estão abaixo de 7.0%.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="bg-card rounded-xl p-6 shadow-sm border border-border border-l-4 border-l-red-500 hover:shadow-md transition-all duration-300">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-muted-foreground tracking-widest font-display">MAIOR (7 DIAS)</span>
          <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-lg">
            <TrendingUp className="w-4 h-4 text-red-700 dark:text-red-400" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold font-display tracking-tight">{displayHighestValue || 0}</span>
          <span className="text-lg text-muted-foreground">mg/dL</span>
        </div>
        {displayHighestTime && (
          <p className="text-sm text-muted-foreground mt-2">
            Registrado {displayHighestTime}
          </p>
        )}
      </div>

      <div className="bg-card rounded-xl p-6 shadow-sm border border-border border-l-4 border-l-blue-500 hover:shadow-md transition-all duration-300">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-muted-foreground tracking-widest font-display">META SEMANAL</span>
          <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
            <Target className="w-4 h-4 text-blue-700 dark:text-blue-400" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold font-display tracking-tight">{displayTimeInRange}%</span>
          <span className="text-lg text-muted-foreground">no alvo</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2.5 mt-2">
          <div
            className={`h-2.5 rounded-full ${parseFloat(String(displayTimeInRange)) >= 70 ? 'bg-green-600 dark:bg-green-500' : parseFloat(String(displayTimeInRange)) >= 50 ? 'bg-yellow-500 dark:bg-yellow-500' : 'bg-red-500 dark:bg-red-500'}`}
            style={{ width: `${displayTimeInRange}%` }}
          ></div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Alvo: &gt;70% (70-180 mg/dL)</p>
      </div>

      <div className="bg-card rounded-xl p-6 shadow-sm border border-border border-l-4 border-l-yellow-500 hover:shadow-md transition-all duration-300">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-muted-foreground tracking-widest font-display">MENOR (7 DIAS)</span>
          <div className="bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded-lg">
            <TrendingDown className="w-4 h-4 text-yellow-700 dark:text-yellow-400" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold font-display tracking-tight">{displayLowestValue || 0}</span>
          <span className="text-lg text-muted-foreground">mg/dL</span>
        </div>
        {displayLowestTime && (
          <p className="text-sm text-muted-foreground mt-2">
            Registrado {displayLowestTime}
          </p>
        )}
      </div>
    </div>
  )
}
