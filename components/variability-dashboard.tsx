"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { calculateStats, analyzeActivityImpact, type VariabilityMetrics, type ActivityCorrelation } from "@/lib/metrics"
import { Activity, TrendingUp, TrendingDown, Timer, Calculator, Zap } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts"
import type { GlucoseReading } from "@/lib/types"

type Props = {
    readings: GlucoseReading[]
}

export function VariabilityDashboard({ readings }: Props) {
    const stats = useMemo(() => calculateStats(readings), [readings])
    const activityImpact = useMemo(() => analyzeActivityImpact(readings), [readings])

    // Prepare chart data for Activity
    const chartData = activityImpact.map(impact => ({
        name: impact.activityType,
        impact: Math.round(impact.impact), // Negative typically means drop, passing as is
        before: Math.round(impact.avgGlucoseBefore),
        after: Math.round(impact.avgGlucoseAfter),
        count: impact.count
    }))

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* CV Card */}
                <Card className="md:col-span-1 border-l-4 border-l-primary shadow-sm bg-gradient-to-br from-card to-muted/20">
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-primary" />
                                    Variabilidade (CV)
                                </CardTitle>
                                <CardDescription>O quão estável está sua glicemia?</CardDescription>
                            </div>
                            <div className={`px-2 py-1 rounded text-xs font-bold ${stats.cv < 36 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                {stats.cv < 36 ? "ESTÁVEL" : "INSTÁVEL"}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold">{stats.cv}%</span>
                            <span className="text-sm text-muted-foreground">Coeficiente de Variação</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            Meta ideal: &lt; 36%. Reflete a amplitude das oscilações glicêmicas.
                        </p>
                    </CardContent>
                </Card>

                {/* SD Card */}
                <Card className="md:col-span-1 border-l-4 border-l-blue-500 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Calculator className="w-5 h-5 text-blue-500" />
                            Desvio Padrão
                        </CardTitle>
                        <CardDescription>Dispersão dos valores</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold">{stats.stdDev}</span>
                            <span className="text-sm text-muted-foreground">mg/dL</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            Quanto menor, mais previsíveis são seus níveis de glicose.
                        </p>
                    </CardContent>
                </Card>

                {/* GMI Card */}
                <Card className="md:col-span-1 border-l-4 border-l-purple-500 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Zap className="w-5 h-5 text-purple-500" />
                            GMI Estimado
                        </CardTitle>
                        <CardDescription>HbA1c estimada</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold">{stats.gmi}%</span>
                            <span className="text-sm text-muted-foreground">(A1c)</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            Indicador de Gestão de Glicose baseado na média atual ({stats.average} mg/dL).
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Activity Impact Section */}
            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingDown className="w-5 h-5 text-green-600" />
                        Impacto da Atividade Física
                    </CardTitle>
                    <CardDescription>
                        Como diferentes exercícios afetam sua glicemia média (Comparação Antes vs Depois)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {chartData.length > 0 ? (
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200} debounce={200}>
                                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} barSize={40}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Legend />
                                    <Bar dataKey="before" name="Média Antes" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="after" name="Média Depois" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground bg-muted/10 rounded-lg border-2 border-dashed">
                            <Activity className="w-10 h-10 mb-2 opacity-20" />
                            <p>Nenhuma atividade registrada no período.</p>
                            <p className="text-sm">Registre atividades para ver análises aqui.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Activity Correlation List */}
            {activityImpact.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activityImpact.map((item) => (
                        <Card key={item.activityType} className="bg-muted/30">
                            <CardContent className="p-4 flex flex-col gap-2">
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold capitalize">{item.activityType}</span>
                                    <span className="text-xs bg-background px-2 py-1 rounded border shadow-sm">
                                        {item.count} registro(s)
                                    </span>
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                    <div className="text-sm">
                                        <span className="text-muted-foreground">Impacto: </span>
                                        <span className={`font-bold ${item.impact < 0 ? 'text-green-600' : 'text-red-500'}`}>
                                            {item.impact > 0 ? '+' : ''}{Math.round(item.impact)} mg/dL
                                        </span>
                                    </div>
                                    {item.impact < 0 && <TrendingDown className="w-4 h-4 text-green-600" />}
                                    {item.impact > 0 && <TrendingUp className="w-4 h-4 text-red-500" />}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
