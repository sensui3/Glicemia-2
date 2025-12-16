"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useGlycemicImpact } from "@/hooks/use-glycemic-impact"
import { format, parseISO } from "date-fns"
import { Utensils, TrendingUp, TrendingDown, RefreshCcw } from "lucide-react"

type Props = {
    userId: string
    filter: string
    startDate?: string
    endDate?: string
}

export function FoodStatsWidget({ userId, filter, startDate, endDate }: Props) {
    // Calculate dates locally to pass to the hook
    const getQueryDates = () => {
        let queryStartDate: string
        let queryEndDate: string = new Date().toISOString().split("T")[0]

        if (filter === "custom" && startDate && endDate) {
            queryStartDate = startDate
            queryEndDate = endDate
        } else {
            const date = new Date()
            // Default 90 days if filter is broad, or specific logic
            // Matching DashboardContent logic somewhat but typically we want stats for the view period
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
                case "custom": // Fallback if no dates
                    queryStartDate = date.toISOString().split("T")[0]
                    break
                default:
                    // 90 days default for stats
                    date.setDate(date.getDate() - 90)
                    queryStartDate = date.toISOString().split("T")[0]
            }
        }
        return { queryStartDate, queryEndDate }
    }

    const { queryStartDate, queryEndDate } = getQueryDates()

    const { data: impacts = [], isLoading } = useGlycemicImpact({
        userId,
        startDate: queryStartDate,
        endDate: queryEndDate
    })

    // Sort by date desc
    const sortedImpacts = [...impacts].sort((a, b) => {
        const dateA = a.reading_date + a.pre_meal_time
        const dateB = b.reading_date + b.pre_meal_time
        return dateB.localeCompare(dateA)
    })

    return (
        <Card className="bg-gradient-to-br from-card to-muted/20 border-teal-100/20 dark:border-teal-900/20 h-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Utensils className="w-5 h-5 text-primary" />
                    Análises Alimentares (BETA)
                </CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center py-6 text-muted-foreground">
                        <RefreshCcw className="w-6 h-6 animate-spin" />
                    </div>
                ) : sortedImpacts.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm flex flex-col items-center gap-2">
                        <div className="bg-muted p-3 rounded-full">
                            <Utensils className="w-6 h-6 text-muted-foreground/50" />
                        </div>
                        <p>Nenhuma refeição analisada no período.</p>
                        <p className="text-xs">Registre leituras "Antes" e "Após" refeições.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {sortedImpacts.slice(0, 3).map(meal => (
                            <div key={meal.meal_id} className="border rounded-lg p-3 bg-card shadow-sm transition-colors hover:bg-muted/50">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium capitalize text-sm">{meal.meal_type?.replace('_', ' ') || "Refeição"}</p>
                                            <span className="text-[10px] text-muted-foreground">
                                                {format(parseISO(meal.reading_date), "dd/MM")} • {meal.pre_meal_time.slice(0, 5)}
                                            </span>
                                        </div>
                                        <div className="flex gap-1.5 flex-wrap mt-2">
                                            {meal.alimentos_consumidos?.map((f: any, idx: number) => (
                                                <span key={idx} className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded-md">
                                                    {f.nome}
                                                </span>
                                            ))}
                                            {(!meal.alimentos_consumidos || meal.alimentos_consumidos.length === 0) && (
                                                <span className="text-[10px] text-muted-foreground italic">Sem detalhes</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="text-right min-w-[80px]">
                                        <div className="text-sm font-bold text-primary">
                                            {Math.round(meal.carbs || 0)}g <span className="text-[10px] font-normal text-muted-foreground">carbs</span>
                                        </div>
                                        {meal.impact !== null ? (
                                            <div className={`text-xs font-medium flex items-center justify-end gap-1 mt-1 ${meal.impact > 50 ? "text-red-500" :
                                                    meal.impact > 30 ? "text-orange-500" : "text-green-500"
                                                }`}>
                                                {meal.impact > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                                {meal.impact > 0 ? "+" : ""}{meal.impact} mg/dL
                                            </div>
                                        ) : (
                                            <div className="text-[10px] text-muted-foreground mt-1 bg-muted px-1.5 py-0.5 rounded-sm inline-block">
                                                Ag. leitura {meal.post_meal_time ? "" : "(4h)"}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
