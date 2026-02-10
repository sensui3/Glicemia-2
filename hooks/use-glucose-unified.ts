"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { GlucoseReading } from "@/lib/types"
import { useEffect } from "react"
import { toast } from "@/components/ui/use-toast"

export type UnifiedOptions = {
    userId: string
    page?: number
    limit?: number
    filter?: string
    periodFilter?: string
    tagFilter?: string
    startDate?: string
    endDate?: string
    sortOrder?: 'asc' | 'desc'
    includeChartData?: boolean
    chartDays?: number
    enabled?: boolean
}

export type GlucoseStatsData = {
    average: number
    highest: number | null
    lowest: number | null
    timeInRange: number
    hba1c: string
}

export type UnifiedResponse = {
    readings: GlucoseReading[]
    pagination: {
        total: number
        page: number
        limit: number
        totalPages: number
    }
    stats?: GlucoseStatsData
    chartData?: GlucoseReading[]
    isLoading: boolean
    isError: boolean
    error: unknown
    refetch: () => void
}

// Chaves de Query separadas para Table e Chart/Stats
export const GLUCOSE_TABLE_KEY = (options: UnifiedOptions) =>
    ['glucose', 'table', {
        userId: options.userId,
        page: options.page,
        limit: options.limit,
        filter: options.filter,
        periodFilter: options.periodFilter,
        tagFilter: options.tagFilter,
        startDate: options.startDate,
        endDate: options.endDate,
        sortOrder: options.sortOrder
    }] as const

export const GLUCOSE_CHART_STATS_KEY = (userId: string, chartDays: number) =>
    ['glucose', 'chart-stats', { userId, chartDays }] as const

export function useGlucoseUnified(options: UnifiedOptions): UnifiedResponse {
    const {
        userId,
        page = 1,
        limit = 15,
        filter = "7days",
        periodFilter,
        tagFilter,
        startDate,
        endDate,
        sortOrder = 'desc',
        includeChartData = false,
        chartDays = 90,
        enabled = true
    } = options

    const queryClient = useQueryClient()

    // 1. Query para Tabela (Paginada e Filtrada)
    const tableQuery = useQuery({
        queryKey: GLUCOSE_TABLE_KEY(options),
        queryFn: async () => {
            const supabase = createClient()
            const offset = (page - 1) * limit

            let query = supabase
                .from("glucose_readings")
                .select("*", { count: 'exact' })
                .eq("user_id", userId)

            // Filtros
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

            if (periodFilter === "morning") {
                query = query.gte("reading_time", "06:00:00").lt("reading_time", "12:00:00")
            } else if (periodFilter === "afternoon") {
                query = query.gte("reading_time", "12:00:00").lt("reading_time", "18:00:00")
            } else if (periodFilter === "night") {
                query = query.or("reading_time.gte.18:00:00,reading_time.lt.06:00:00")
            }

            if (tagFilter === "insulin") query = query.ilike("observations", "%insulina%")
            if (tagFilter === "hypo") query = query.lt("reading_value", 70)
            if (tagFilter === "hyper") query = query.gt("reading_value", 180)

            query = query
                .order("reading_date", { ascending: sortOrder === 'asc' })
                .order("reading_time", { ascending: sortOrder === 'asc' })
                .range(offset, offset + limit - 1)

            const { data, error, count } = await query

            if (error) throw error

            return {
                readings: data as GlucoseReading[],
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit)
            }
        },
        enabled: !!userId && enabled,
        staleTime: 1000 * 30, // 30 segundos para tabela (mais dinâmica)
    })

    // 2. Query para Stats e ChartData (Cache Longo)
    const chartQuery = useQuery({
        queryKey: GLUCOSE_CHART_STATS_KEY(userId, chartDays),
        queryFn: async () => {
            const supabase = createClient()

            // Stats RPC
            const statsPromise = supabase.rpc('get_glucose_stats', {
                p_user_id: userId,
                p_days: chartDays
            })

            // Chart Data (90 dias fixed window from now for overview)
            const chartQueryPromise = supabase
                .from("glucose_readings")
                .select("reading_date, reading_time, reading_value, condition")
                .eq("user_id", userId)
                .gte("reading_date", new Date(Date.now() - chartDays * 86400000).toISOString().split("T")[0])
                .order("reading_date", { ascending: true })
                .order("reading_time", { ascending: true })

            const [statsResult, chartResult] = await Promise.all([statsPromise, chartQueryPromise])

            if (statsResult.error) throw statsResult.error
            if (chartResult.error) throw chartResult.error

            return {
                stats: statsResult.data as GlucoseStatsData,
                chartData: chartResult.data as GlucoseReading[]
            }
        },
        enabled: !!userId && enabled && includeChartData,
        staleTime: 1000 * 60 * 5, // 5 minutos para stats e chart (menos dinâmico)
    })

    // Unificar loading e erros
    const isLoading = tableQuery.isLoading || (includeChartData && chartQuery.isLoading)
    const isError = tableQuery.isError || (includeChartData && chartQuery.isError)
    const error = tableQuery.error || chartQuery.error

    // Função unificada de refetch (invalida ambos estrategicamente)
    const refetch = () => {
        queryClient.invalidateQueries({ queryKey: GLUCOSE_TABLE_KEY(options) })
        if (includeChartData) {
            queryClient.invalidateQueries({ queryKey: GLUCOSE_CHART_STATS_KEY(userId, chartDays) })
        }
    }

    return {
        readings: tableQuery.data?.readings || [],
        pagination: {
            total: tableQuery.data?.total || 0,
            page,
            limit,
            totalPages: tableQuery.data?.totalPages || 0
        },
        stats: chartQuery.data?.stats,
        chartData: chartQuery.data?.chartData,
        isLoading,
        isError,
        error,
        refetch
    }
}

// ─── Legacy Keys (mantidas para invalidação global) ───
export const GLUCOSE_KEYS = {
    all: ["glucose"] as const,
    lists: () => [...GLUCOSE_KEYS.all, "list"] as const,
    list: (filters: string) => [...GLUCOSE_KEYS.lists(), { filters }] as const,
    details: () => [...GLUCOSE_KEYS.all, "detail"] as const,
    detail: (id: string) => [...GLUCOSE_KEYS.details(), id] as const,
}

// ─── Mutation: Adicionar Leitura ───
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
            queryClient.invalidateQueries({ queryKey: ['glucose'] })
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

// ─── Realtime: Subscribe to Glucose Changes ───
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
                (_payload: unknown) => {
                    queryClient.invalidateQueries({ queryKey: GLUCOSE_KEYS.lists() })
                    queryClient.invalidateQueries({ queryKey: ['glucose'] })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [userId, queryClient])
}
