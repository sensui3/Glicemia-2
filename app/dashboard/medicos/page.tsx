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

    if (!userId) return null

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2 text-foreground">Meus Médicos</h1>
                <p className="text-muted-foreground">Gerencie sua equipe médica e consultas.</p>
            </div>
            <DoctorsList userId={userId} />
        </div>
    )
}
