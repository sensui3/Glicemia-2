"use client"

import { useMemo, useState, lazy, Suspense } from "react"
// Removidos imports estáticos do recharts
import { format, parseISO, subDays, isAfter } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, TrendingUp, TrendingDown, Minus } from "lucide-react"
import type { GlucoseReading, GlucoseLimits } from "@/lib/types"
import { ChartSkeleton } from "@/components/ui/skeletons"

// Lazy load Recharts components
const AreaChart = lazy(() => import('recharts').then(m => ({ default: m.AreaChart })))
const Area = lazy(() => import('recharts').then(m => ({ default: m.Area })))
const CartesianGrid = lazy(() => import('recharts').then(m => ({ default: m.CartesianGrid })))
const XAxis = lazy(() => import('recharts').then(m => ({ default: m.XAxis })))
const YAxis = lazy(() => import('recharts').then(m => ({ default: m.YAxis })))
const Tooltip = lazy(() => import('recharts').then(m => ({ default: m.Tooltip })))
const ReferenceLine = lazy(() => import('recharts').then(m => ({ default: m.ReferenceLine })))
const Legend = lazy(() => import('recharts').then(m => ({ default: m.Legend })))
const ResponsiveContainer = lazy(() => import('recharts').then(m => ({ default: m.ResponsiveContainer })))

type Props = {
  readings: GlucoseReading[]
  limits?: GlucoseLimits
}

export function GlucoseChart({ readings, limits }: Props) {
  const [range, setRange] = useState("30")

  // Otimização: Single pass loop para filtrar e formatar dados
  const chartData = useMemo(() => {
    if (!readings || readings.length === 0) return []

    // Sort deve ser feito apenas uma vez se os dados já não vierem ordenados
    // Assumindo que readings podem vir desordenados devido a edições recentes
    const sorted = [...readings].sort((a, b) =>
      (a.reading_date + a.reading_time).localeCompare(b.reading_date + b.reading_time)
    )

    const cutoff = range === "all"
      ? 0
      : Date.now() - parseInt(range) * 86400000

    const result = []

    // Single pass filtering and formatting
    for (let i = 0; i < sorted.length; i++) {
      const r = sorted[i]
      const readingDate = parseISO(r.reading_date)
      const ts = readingDate.getTime()

      if (range === "all" || ts >= cutoff) {
        result.push({
          date: format(readingDate, "dd/MM"),
          fullDate: r.reading_date,
          time: r.reading_time.slice(0, 5),
          value: r.reading_value,
          condition: r.condition
        })
      }
    }

    return result
  }, [readings, range])

  // Calculate stats for the selected period (mantido lógica original simplificada)
  const stats = useMemo(() => {
    if (chartData.length === 0) return null
    const values = chartData.map(d => d.value)

    if (values.length === 0) return null

    const sum = values.reduce((a, b) => a + b, 0)
    const avg = Math.round(sum / values.length)
    const min = Math.min(...values)
    const max = Math.max(...values)

    // Trend calculation
    let trend: "up" | "down" | "stable" = "stable"
    const n = Math.min(5, values.length)
    if (n >= 2) {
      const firstAvg = values.slice(0, n).reduce((a, b) => a + b, 0) / n
      const lastAvg = values.slice(-n).reduce((a, b) => a + b, 0) / n
      if (Math.abs(lastAvg - firstAvg) > 5) { // Margem de erro para estabilidade
        trend = lastAvg > firstAvg ? "up" : "down"
      }
    }

    return { avg, min, max, trend }
  }, [chartData])

  // Defults if limits are missing
  const fastingMin = limits?.fasting_min || 70
  const postMealMax = limits?.post_meal_max || 140

  return (
    <Card className="col-span-1 shadow-xl border-primary/5 overflow-hidden">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="font-display text-2xl tracking-tight">Evolução da Glicemia</CardTitle>
            <CardDescription>
              Acompanhe seus níveis ao longo do tempo ({range === "all" ? "Todo o período" : `Últimos ${range} dias`})
            </CardDescription>
          </div>

          <Tabs value={range} onValueChange={setRange} className="w-full md:w-auto">
            <TabsList className="grid w-full grid-cols-4 md:w-[320px] h-12">
              <TabsTrigger value="7" className="h-9 px-4">7 Dias</TabsTrigger>
              <TabsTrigger value="14" className="h-9 px-4">14 Dias</TabsTrigger>
              <TabsTrigger value="30" className="h-9 px-4">30 Dias</TabsTrigger>
              <TabsTrigger value="90" className="h-9 px-4">90 Dias</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full mt-4">
          {chartData.length > 0 ? (
            <Suspense fallback={<ChartSkeleton />}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200} debounce={200}>
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop key="start" offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                      <stop key="end" offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    minTickGap={30}
                    tick={{ fontSize: 12, fill: '#888' }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: '#888' }}
                    domain={[0, 'auto']}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    labelStyle={{ color: '#666', marginBottom: '0.25rem' }}
                  />
                  <Legend iconType="circle" />

                  {/* Reference Areas/Lines */}
                  <ReferenceLine y={fastingMin} stroke="#22c55e" strokeDasharray="3 3" label={{ position: 'right', value: 'Min', fill: '#22c55e', fontSize: 10 }} />
                  <ReferenceLine y={postMealMax} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'right', value: 'Max', fill: '#ef4444', fontSize: 10 }} />

                  <Area
                    type="monotone"
                    dataKey="value"
                    name="Glicemia (mg/dL)"
                    stroke="#f97316"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorValue)"
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Suspense>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground bg-muted/20 rounded-lg">
              <AlertCircle className="w-10 h-10 mb-2 opacity-20" />
              <p>Sem dados suficientes para o período</p>
            </div>
          )}
        </div>
      </CardContent>
      {stats && (
        <CardFooter className="flex justify-between border-t p-4 bg-muted/20 rounded-b-xl gap-4 overflow-x-auto">
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider font-display">Média</span>
            <span className="text-2xl font-bold font-display">{stats.avg}</span>
          </div>
          <div className="flex flex-col border-l pl-4">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider font-display">Mínima</span>
            <span className="text-xl font-semibold text-green-600 font-display">{stats.min}</span>
          </div>
          <div className="flex flex-col border-l pl-4">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider font-display">Máxima</span>
            <span className="text-xl font-semibold text-red-600 font-display">{stats.max}</span>
          </div>
          <div className="flex flex-col border-l pl-4 items-center">
            <span className="text-xs text-muted-foreground uppercase font-bold">Tendência</span>
            {stats.trend === 'up' && <TrendingUp className="w-6 h-6 text-red-500" />}
            {stats.trend === 'down' && <TrendingDown className="w-6 h-6 text-green-500" />}
            {stats.trend === 'stable' && <Minus className="w-6 h-6 text-yellow-500" />}
          </div>
        </CardFooter>
      )}
    </Card>
  )
}
