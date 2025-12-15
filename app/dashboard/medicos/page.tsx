"use client"

import { useEffect, useState } from "react"
import { DoctorsList } from "@/components/doctors-list"
import { createClient } from "@/lib/supabase/client"
import { DashboardHeader } from "@/components/dashboard-header"
import { useRouter } from "next/navigation"

export default function DoctorsPage() {
    const [userId, setUserId] = useState<string | null>(null)
    const router = useRouter()

    useEffect(() => {
        async function getUser() {
            const supabase = createClient()
            const {
                data: { user },
            } = await supabase.auth.getUser()
            if (user) {
                setUserId(user.id)
            } else {
                router.push("/auth/login")
            }
        }
        getUser()
    }, [router])

    if (!userId) return null

    return <DoctorsList userId={userId} />
}
