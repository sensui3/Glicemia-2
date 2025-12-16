"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GlucoseReading } from "@/lib/types"
import { parseISO, differenceInMinutes, format } from "date-fns"
import { Utensils, TrendingUp, TrendingDown, Minus } from "lucide-react"

type Props = {
    readings: GlucoseReading[]
}

export function FoodStatsWidget({ readings }: Props) {
    // Filter readings that have food info
    const mealReadings = readings.filter(r =>
        r.alimentos_consumidos &&
        r.alimentos_consumidos.length > 0
    ).sort((a, b) => b.reading_date.localeCompare(a.reading_date) || b.reading_time.localeCompare(a.reading_time))

    // Sort all readings ascending for lookup
    const sortedReadings = [...readings].sort((a, b) => {
        const dateA = a.reading_date + a.reading_time
        const dateB = b.reading_date + b.reading_time
        return dateA.localeCompare(dateB)
    })

    // Match with subsequent readings to calculate impact
    const analyzedMeals = mealReadings.map(meal => {
        const mealDateTime = parseISO(`${meal.reading_date}T${meal.reading_time}`)

        // Find next reading within 4 hours
        // Since sortedReadings is sorted asc, we can find the meal index and look ahead
        const nextReading = sortedReadings.find(r => {
            if (r.id === meal.id) return false
            const rDateTime = parseISO(`${r.reading_date}T${r.reading_time}`)
            const diff = differenceInMinutes(rDateTime, mealDateTime)
            return diff > 30 && diff < 240 // Between 30m and 4h
        })

        let delta = null
        if (nextReading) {
            delta = nextReading.reading_value - meal.reading_value
        }

        return {
            ...meal,
            impact_delta: delta,
            next_reading: nextReading
        }
    })

    return (
        <Card className="bg-gradient-to-br from-card to-muted/20 border-teal-100/20 dark:border-teal-900/20">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Utensils className="w-5 h-5 text-primary" />
                    Análises Alimentares
                </CardTitle>
            </CardHeader>
            <CardContent>
                {analyzedMeals.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm flex flex-col items-center gap-2">
                        <div className="bg-muted p-3 rounded-full">
                            <Utensils className="w-6 h-6 text-muted-foreground/50" />
                        </div>
                        <p>Nenhuma refeição registrada com detalhes.</p>
                        <p className="text-xs">Comece adicionando alimentos aos seus registros!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {analyzedMeals.slice(0, 3).map(meal => (
                            <div key={meal.id} className="border rounded-lg p-3 bg-card shadow-sm">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium capitalize text-sm">{meal.refeicao_tipo?.replace('_', ' ') || "Refeição"}</p>
                                            <span className="text-[10px] text-muted-foreground">{format(parseISO(meal.reading_date), "dd/MM")} • {meal.reading_time.slice(0, 5)}</span>
                                        </div>
                                        <div className="flex gap-1.5 flex-wrap mt-2">
                                            {meal.alimentos_consumidos?.map((f: any, idx) => (
                                                <span key={idx} className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded-md">
                                                    {f.nome}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="text-right min-w-[80px]">
                                        <div className="text-sm font-bold text-primary">{Math.round(meal.carbs || 0)}g <span className="text-[10px] font-normal text-muted-foreground">carbs</span></div>
                                        {meal.impact_delta !== null ? (
                                            <div className={`text-xs font-medium flex items-center justify-end gap-1 mt-1 ${meal.impact_delta > 50 ? "text-red-500" :
                                                    meal.impact_delta > 30 ? "text-orange-500" : "text-green-500"
                                                }`}>
                                                {meal.impact_delta > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                                {meal.impact_delta > 0 ? "+" : ""}{meal.impact_delta} mg/dL
                                            </div>
                                        ) : (
                                            <div className="text-[10px] text-muted-foreground mt-1 bg-muted px-1.5 py-0.5 rounded-sm inline-block">Ag. leitura</div>
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
