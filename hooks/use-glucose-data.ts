import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { GlucoseReading } from "@/lib/types"

type UseGlucoseDataParams = {
    userId: string
    filter: string
    startDate?: string
    endDate?: string
    periodFilter?: string
    tagFilter?: string
}

export function useGlucoseData({
    userId,
    filter,
    startDate,
    endDate,
    periodFilter = "all",
    tagFilter = "all",
}: UseGlucoseDataParams) {
    const getQueryDates = () => {
        let queryStartDate: string
        let queryEndDate: string = new Date().toISOString().split("T")[0]

        if (filter === "custom" && startDate && endDate) {
            queryStartDate = startDate
            queryEndDate = endDate
        } else {
            const date = new Date()
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
                default:
                    date.setDate(date.getDate() - 7)
                    queryStartDate = date.toISOString().split("T")[0]
            }
        }
        return { queryStartDate, queryEndDate }
    }

    return useQuery({
        queryKey: ["glucose-data", userId, filter, startDate, endDate, periodFilter, tagFilter],
        queryFn: async () => {
            const supabase = createClient()
            const { queryStartDate, queryEndDate } = getQueryDates()

            let query = supabase
                .from("glucose_readings")
                .select("*")
                .eq("user_id", userId)
                .gte("reading_date", queryStartDate)
                .lte("reading_date", queryEndDate)

            // Apply Advanced Filters
            if (periodFilter === "morning") {
                query = query.gte("reading_time", "06:00:00").lt("reading_time", "12:00:00")
            } else if (periodFilter === "afternoon") {
                query = query.gte("reading_time", "12:00:00").lt("reading_time", "18:00:00")
            } else if (periodFilter === "night") {
                query = query.or("reading_time.gte.18:00:00,reading_time.lt.06:00:00")
            }

            if (tagFilter === "insulin") {
                query = query.ilike("observations", "%insulina%")
            } else if (tagFilter === "fasting") {
                query = query.eq("condition", "jejum")
            } else if (tagFilter === "post_meal") {
                query = query.eq("condition", "apos_refeicao")
            } else if (tagFilter === "hypo") {
                query = query.lt("reading_value", 70)
            } else if (tagFilter === "hyper") {
                query = query.gt("reading_value", 140)
            } else if (tagFilter === "exercise") {
                query = query.not("activity_type", "is", null)
            }

            const { data, error } = await query
                .order("reading_date", { ascending: false })
                .order("reading_time", { ascending: false })

            if (error) throw error

            return (data || []) as GlucoseReading[]
        },
        staleTime: 1000 * 60 * 5, // 5 minutes cache
    })
}
