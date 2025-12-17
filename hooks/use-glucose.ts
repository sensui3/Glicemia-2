import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { GlucoseReading } from "@/lib/types"
import { useEffect } from "react"
import { toast } from "@/components/ui/use-toast"

export const GLUCOSE_KEYS = {
    all: ["glucose"] as const,
    lists: () => [...GLUCOSE_KEYS.all, "list"] as const,
    list: (filters: string) => [...GLUCOSE_KEYS.lists(), { filters }] as const,
    details: () => [...GLUCOSE_KEYS.all, "detail"] as const,
    detail: (id: string) => [...GLUCOSE_KEYS.details(), id] as const,
}

type UseGlucoseOptions = {
    userId: string
    filter?: string // 'today', '7days', '30days', 'all'
    periodFilter?: string
    tagFilter?: string
    enabled?: boolean
    startDate?: string
    endDate?: string
}

export function useGlucoseReadings({ userId, filter = "7days", periodFilter, tagFilter, enabled = true, startDate, endDate }: UseGlucoseOptions) {
    return useQuery({
        queryKey: GLUCOSE_KEYS.list(`${userId}-${filter}-${periodFilter}-${tagFilter}`),
        queryFn: async () => {
            const supabase = createClient()
            let query = supabase
                .from("glucose_readings")
                .select("*")
                .eq("user_id", userId)

            // Date Filters
            const now = new Date()
            if (filter === "custom" && startDate && endDate) {
                query = query.gte("reading_date", startDate).lte("reading_date", endDate)
            } else if (filter === "today") {
                const today = now.toISOString().split("T")[0]
                query = query.gte("reading_date", today)
            } else if (filter === "7days") {
                const date = new Date()
                date.setDate(date.getDate() - 7)
                query = query.gte("reading_date", date.toISOString().split("T")[0])
            } else if (filter === "30days") {
                const date = new Date()
                date.setDate(date.getDate() - 30)
                query = query.gte("reading_date", date.toISOString().split("T")[0])
            } else if (filter === "90days") {
                const date = new Date()
                date.setDate(date.getDate() - 90)
                query = query.gte("reading_date", date.toISOString().split("T")[0])
            }

            // Period Filters
            if (periodFilter === "morning") {
                query = query.gte("reading_time", "06:00:00").lt("reading_time", "12:00:00")
            } else if (periodFilter === "afternoon") {
                query = query.gte("reading_time", "12:00:00").lt("reading_time", "18:00:00")
            } else if (periodFilter === "night") {
                query = query.or("reading_time.gte.18:00:00,reading_time.lt.06:00:00")
            }

            // Tag Filters
            if (tagFilter === "insulin") query = query.ilike("observations", "%insulina%")
            if (tagFilter === "hypo") query = query.lt("reading_value", 70)
            if (tagFilter === "hyper") query = query.gt("reading_value", 180)

            const { data, error } = await query
                .order("reading_date", { ascending: false })
                .order("reading_time", { ascending: false })

            if (error) throw error
            return data as GlucoseReading[]
        },
        enabled: !!userId && enabled,
    })
}

export function useAddGlucoseReading() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (newReading: Partial<GlucoseReading>) => {
            const supabase = createClient()
            const { data, error } = await supabase
                .from("glucose_readings")
                .insert(newReading)
                .select()
                .single()

            if (error) throw error
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: GLUCOSE_KEYS.lists() })
            toast({
                title: "Sucesso",
                description: "Registro de glicemia adicionado.",
                duration: 3000,
            })
        },
        onError: (error) => {
            toast({
                title: "Erro",
                description: `Erro ao salvar: ${error.message}`,
                variant: "destructive",
            })
        }
    })
}

export function useSubscribeToGlucose(userId: string) {
    const queryClient = useQueryClient()

    useEffect(() => {
        if (!userId) return

        const supabase = createClient()
        const channel = supabase
            .channel('glucose-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'glucose_readings',
                    filter: `user_id=eq.${userId}`
                },
                (payload) => {
                    // Smart invalidation: could optimize to update cache directly, 
                    // but invalidating list is safer for consistency for now.
                    queryClient.invalidateQueries({ queryKey: GLUCOSE_KEYS.lists() })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [userId, queryClient])
}
