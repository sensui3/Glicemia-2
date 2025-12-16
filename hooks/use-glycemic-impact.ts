import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"

export type GlycemicImpact = {
    meal_id: string
    reading_date: string
    pre_meal_time: string
    pre_meal_value: number
    post_meal_time: string | null
    post_meal_value: number | null
    impact: number | null
    meal_type: string | null
    carbs: number | null
    observations: string | null
    alimentos_consumidos: { nome: string; porcao_g: number; carboidratos_g: number }[] | null
}

type UseGlycemicImpactParams = {
    userId: string
    startDate: string
    endDate: string
    enabled?: boolean
}

export function useGlycemicImpact({
    userId,
    startDate,
    endDate,
    enabled = true,
}: UseGlycemicImpactParams) {
    return useQuery({
        queryKey: ["glycemic-impact", userId, startDate, endDate],
        queryFn: async () => {
            const supabase = createClient()

            const { data, error } = await supabase.rpc("get_glycemic_impacts", {
                p_start_date: startDate,
                p_end_date: endDate,
            })

            if (error) {
                console.error("Error fetching glycemic impact:", JSON.stringify(error, null, 2), "Params:", { startDate, endDate })
                throw error
            }

            return (data || []) as GlycemicImpact[]
        },
        enabled: enabled && !!userId && !!startDate && !!endDate,
        staleTime: 1000 * 60 * 5, // 5 minutes
    })
}
