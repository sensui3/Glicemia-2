"use client"

import { useMemo, memo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { GlucoseReading } from "@/lib/types"

type Props = {
  readings: GlucoseReading[]
}

const GlucoseChartBase = ({ readings, limits }: Props & { limits?: import("@/lib/types").GlucoseLimits }) => {
  const chartData = useMemo(() => {
    return [...readings]
      .sort((a, b) => {
        const dateA = new Date(`${a.reading_date}T${a.reading_time}`)
        const dateB = new Date(`${b.reading_date}T${b.reading_time}`)
        return dateA.getTime() - dateB.getTime()
      })
      .map((reading) => ({
        date: reading.reading_date,
        time: reading.reading_time,
        value: reading.reading_value,
        condition: reading.condition,
        displayDate: format(parseISO(reading.reading_date), "dd/MMM", { locale: ptBR }),
        fullDateTime: `${format(parseISO(reading.reading_date), "dd/MM/yyyy")} ${reading.reading_time.slice(0, 5)}`,
      }))
  }, [readings])

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border">
          <p className="font-semibold text-sm mb-1">{data.fullDateTime}</p>
          <p className="text-teal-600 font-bold text-lg">{data.value} mg/dL</p>
          <p className="text-xs text-gray-500 mt-1">{getConditionLabel(data.condition)}</p>
        </div>
      )
    }
    return null
  }

  const getConditionLabel = (condition: string) => {
    const labels: Record<string, string> = {
      jejum: "Jejum",
      antes_refeicao: "Antes da Refeição",
      apos_refeicao: "Após Refeição",
      ao_dormir: "Ao Dormir",
      outro: "Outro",
    }
    return labels[condition] || condition
  }

  // Define defaults if limits not provided
  const fastingMin = limits?.fasting_min ?? 70
  const fastingMax = limits?.fasting_max ?? 99
  const postMealMax = limits?.post_meal_max ?? 140
  // const hypoLimit = limits?.hypo_limit ?? 70
  // const hyperLimit = limits?.hyper_limit ?? 180

  if (chartData.length === 0) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Gráfico de Monitoramento</CardTitle>
          <CardDescription>Evolução dos níveis de glicose ao longo do tempo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-gray-500">
            Nenhum dado disponível para exibir no gráfico
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Gráfico de Monitoramento</CardTitle>
        <CardDescription>Evolução dos níveis de glicose ao longo do tempo</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorGlucose" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0f766e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#0f766e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="displayDate" stroke="#6b7280" style={{ fontSize: "12px" }} />
            <YAxis
              stroke="#6b7280"
              style={{ fontSize: "12px" }}
              label={{ value: "mg/dL", angle: -90, position: "insideLeft", style: { fontSize: "12px" } }}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Linhas de referência dinâmicas */}
            <ReferenceLine
              y={fastingMin}
              stroke="#22c55e"
              strokeDasharray="3 3"
              label={{ value: `Mínimo (${fastingMin})`, position: "insideTopLeft", fontSize: 10 }}
            />
            <ReferenceLine
              y={fastingMax}
              stroke="#22c55e"
              strokeDasharray="3 3"
              label={{ value: `Máximo Normal (${fastingMax})`, position: "insideTopLeft", fontSize: 10 }}
            />
            <ReferenceLine
              y={postMealMax}
              stroke="#f59e0b"
              strokeDasharray="3 3"
              label={{ value: `Meta Pós-Refeição (${postMealMax})`, position: "insideTopLeft", fontSize: 10 }}
            />

            <Area
              type="monotone"
              dataKey="value"
              stroke="#0f766e"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorGlucose)"
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Legenda Dinâmica */}
        <div className="mt-4 flex flex-wrap gap-4 justify-center text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">Normal Faixa Jejum ({fastingMin}-{fastingMax} mg/dL)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-gray-600">Meta Pós-Refeição (até {postMealMax} mg/dL)</span>
          </div>
          {/* Can add more legends if needed, keeping it simple */}
        </div>
      </CardContent>
    </Card>
  )
}

export const GlucoseChart = memo(GlucoseChartBase)
