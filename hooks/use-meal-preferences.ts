import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { MealTimes } from "@/lib/types"

export type MealType = "cafe_manha" | "lanche_manha" | "almoco" | "lanche_tarde" | "jantar" | "lanche_noturno"

export type MealSuggestion = {
    mealType: MealType
    mealLabel: string
    scheduledTime: string
    isInWindow: boolean
}

const DEFAULT_MEAL_TIMES: MealTimes = {
    cafe_manha: "07:30",
    lanche_manha: "10:00",
    almoco: "12:00",
    lanche_tarde: "15:00",
    jantar: "18:00",
    lanche_noturno: "21:00"
}

const DEFAULT_ADVANCE_MINUTES = 45

const MEAL_LABELS: Record<MealType, string> = {
    cafe_manha: "Café da Manhã",
    lanche_manha: "Lanche da Manhã",
    almoco: "Almoço",
    lanche_tarde: "Lanche da Tarde",
    jantar: "Jantar",
    lanche_noturno: "Lanche Noturno"
}

/**
 * Hook para gerenciar configurações de horários de refeições e sugestões automáticas
 */
export function useMealPreferences() {
    const [mealTimes, setMealTimes] = useState<MealTimes>(DEFAULT_MEAL_TIMES)
    const [advanceMinutes, setAdvanceMinutes] = useState<number>(DEFAULT_ADVANCE_MINUTES)
    const [loading, setLoading] = useState(true)

    // Carrega as preferências do usuário
    useEffect(() => {
        loadPreferences()
    }, [])

    const loadPreferences = async () => {
        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                setLoading(false)
                return
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('meal_times, meal_advance_minutes')
                .eq('user_id', user.id)
                .single()

            if (profile) {
                if (profile.meal_times) {
                    setMealTimes(profile.meal_times as MealTimes)
                }
                if (profile.meal_advance_minutes !== null && profile.meal_advance_minutes !== undefined) {
                    setAdvanceMinutes(profile.meal_advance_minutes)
                }
            }
        } catch (error) {
            console.error("Erro ao carregar preferências de refeições:", error)
        } finally {
            setLoading(false)
        }
    }

    /**
     * Salva as preferências no banco de dados
     */
    const savePreferences = async (newMealTimes: MealTimes, newAdvanceMinutes: number) => {
        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) return { success: false, error: "Usuário não autenticado" }

            const { error } = await supabase
                .from('profiles')
                .upsert({
                    user_id: user.id,
                    meal_times: newMealTimes,
                    meal_advance_minutes: newAdvanceMinutes,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' })

            if (error) {
                return { success: false, error: error.message }
            }

            setMealTimes(newMealTimes)
            setAdvanceMinutes(newAdvanceMinutes)

            return { success: true }
        } catch (error: any) {
            return { success: false, error: error.message }
        }
    }

    /**
     * Detecta a próxima refeição baseada no horário atual
     * Retorna a refeição se estivermos dentro da janela de antecedência
     */
    const detectMealFromTime = useCallback((currentTime: string): MealSuggestion | null => {
        const timeToMinutes = (time: string): number => {
            const [hours, minutes] = time.split(':').map(Number)
            return hours * 60 + minutes
        }

        const currentMinutes = timeToMinutes(currentTime)

        // Array de refeições ordenadas por horário
        const meals: Array<{ type: MealType; time: string }> = [
            { type: "cafe_manha", time: mealTimes.cafe_manha },
            { type: "lanche_manha", time: mealTimes.lanche_manha },
            { type: "almoco", time: mealTimes.almoco },
            { type: "lanche_tarde", time: mealTimes.lanche_tarde },
            { type: "jantar", time: mealTimes.jantar },
            { type: "lanche_noturno", time: mealTimes.lanche_noturno }
        ]

        // Encontra a próxima refeição
        for (const meal of meals) {
            const mealMinutes = timeToMinutes(meal.time)
            const windowStart = mealMinutes - advanceMinutes
            const windowEnd = mealMinutes

            // Verifica se estamos na janela de antecedência
            if (currentMinutes >= windowStart && currentMinutes <= windowEnd) {
                return {
                    mealType: meal.type,
                    mealLabel: MEAL_LABELS[meal.type],
                    scheduledTime: meal.time,
                    isInWindow: true
                }
            }
        }

        // Se não encontrou nenhuma refeição na janela, retorna a próxima refeição futura
        for (const meal of meals) {
            const mealMinutes = timeToMinutes(meal.time)
            if (currentMinutes < mealMinutes - advanceMinutes) {
                return {
                    mealType: meal.type,
                    mealLabel: MEAL_LABELS[meal.type],
                    scheduledTime: meal.time,
                    isInWindow: false
                }
            }
        }

        // Se passou de todas as refeições do dia, sugere o café da manhã do próximo dia
        return {
            mealType: "cafe_manha",
            mealLabel: MEAL_LABELS.cafe_manha,
            scheduledTime: mealTimes.cafe_manha,
            isInWindow: false
        }
    }, [mealTimes, advanceMinutes])

    /**
     * Retorna o slug do tipo de refeição para salvar no banco
     */
    const getMealTypeSlug = useCallback((mealType: MealType): string => {
        const slugMap: Record<MealType, string> = {
            cafe_manha: "cafe_manha",
            lanche_manha: "lanche",
            almoco: "almoco",
            lanche_tarde: "lanche",
            jantar: "jantar",
            lanche_noturno: "lanche"
        }
        return slugMap[mealType]
    }, [])

    return {
        mealTimes,
        advanceMinutes,
        loading,
        savePreferences,
        detectMealFromTime,
        getMealTypeSlug,
        MEAL_LABELS
    }
}
