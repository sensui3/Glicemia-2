import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { UserProfile } from "@/lib/types"

export function useUserProfile(userId: string) {
    const supabase = createClient()

    return useQuery({
        queryKey: ["user-profile", userId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("user_id", userId)
                .single()

            if (error) {
                throw error
            }

            return data as UserProfile
        },
        enabled: !!userId,
    })
}
