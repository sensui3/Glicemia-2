"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { TrendingUp, TrendingDown, Activity, Percent, Info } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

type Props = {
  userId: string
  refreshKey?: number
}

type Hba1cPoint = {
  date: string
  value: number
  formattedDate: string
}

export function GlucoseStats({ userId, refreshKey }: Props) {
  const [average, setAverage] = useState(0)
  const [highest, setHighest] = useState<any>(null)
  const [lowest, setLowest] = useState<any>(null)
  const [trend, setTrend] = useState(0)
  const [hba1c, setHba1c] = useState<string | number>(0)
  const [hba1cHistory, setHba1cHistory] = useState<Hba1cPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void loadStats()
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

    // Para o cálculo detalhado de histórico, precisamos de mais dados (ex: 6 meses + 90 dias de janela)
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
    const sevenDayReadings = allReadings.filter((r) => new Date(r.reading_date) >= sevenDaysAgo)

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
    const previousWeekReadings = allReadings.filter((r) => {
      const d = new Date(r.reading_date)
      return d >= fourteenDaysAgo && d < sevenDaysAgo
    })

    const previousAverage =
      previousWeekReadings.length > 0
        ? previousWeekReadings.reduce((sum, r) => sum + r.reading_value, 0) / previousWeekReadings.length
        : 0

    const calculatedTrend =
      previousAverage > 0 ? Math.round(((avg - previousAverage) / previousAverage) * 100) : 0
    setTrend(calculatedTrend)

    // Calcular HbA1c atual (baseada nos últimos 90 dias a partir de hoje)
    const currentReadings90 = allReadings.filter((r) => new Date(r.reading_date) >= ninetyDaysAgo)

    const avg90 =
      currentReadings90.length > 0
        ? currentReadings90.reduce((sum, r) => sum + r.reading_value, 0) / currentReadings90.length
        : 0

    const estimatedA1c = avg90 > 0 ? ((avg90 + 46.7) / 28.7).toFixed(1) : 0
    setHba1c(estimatedA1c)

    // Calcular histórico da HbA1c (pontos semanais para as últimas 12 semanas)
    const history: Hba1cPoint[] = []
    // Gerar 12 pontos (um a cada semana) até hoje
    for (let i = 12; i >= 0; i--) {
      const refDate = new Date()
      refDate.setDate(refDate.getDate() - i * 7)

      const windowStart = new Date(refDate)
      windowStart.setDate(windowStart.getDate() - 90) // Janela de 90 dias para trás da data de referência

      // Filtrar leituras para essa janela específica [windowStart, refDate]
      const windowReadings = allReadings.filter((r) => {
        const d = new Date(r.reading_date + "T" + r.reading_time) // Adicionar tempo para precisão se necessário, ou só data
        // Simplificando comparação de datas strings 'YYYY-MM-DD'
        const rDate = new Date(r.reading_date)
        // Comparação de datas (ignorando horas para simplificar ou usando timestamp)
        return rDate <= refDate && rDate >= windowStart
      })

      if (windowReadings.length > 0) {
        const wAvg = windowReadings.reduce((sum, r) => sum + r.reading_value, 0) / windowReadings.length
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
          <div
            className={`flex items-center gap-1 mt-2 text-sm ${trend > 0 ? "text-red-600" : "text-green-600"}`}
          >
            {trend > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span>{Math.abs(trend)}% vs semana anterior</span>
          </div>
        )}
      </div>

      {/* HbA1c Estimada com Modal */}
      <Dialog>
        <DialogTrigger asChild>
          <div className="bg-white rounded-xl p-6 shadow-sm cursor-pointer transition-all hover:shadow-md border border-transparent hover:border-purple-200 group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600 group-hover:text-purple-700 transition-colors">
                HbA1c ESTIMADA
              </span>
              <div className="bg-purple-100 p-2 rounded-lg group-hover:bg-purple-200 transition-colors">
                <Percent className="w-4 h-4 text-purple-700" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">{hba1c}</span>
              <span className="text-lg text-gray-500">%</span>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm text-gray-500 group-hover:text-purple-600">
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
              {hba1cHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={hba1cHistory}>
                    <defs>
                      <linearGradient id="colorA1c" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#9333ea" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#9333ea" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="formattedDate"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      domain={['dataMin - 0.5', 'dataMax + 0.5']}
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number) => [`${value}%`, "HbA1c"]}
                      labelFormatter={(label) => `Semana de ${label}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#9333ea"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorA1c)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Dados insuficientes para gerar histórico
                </div>
              )}
            </div>
            <div className="mt-4 text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
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
