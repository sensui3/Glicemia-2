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

    return (
        <div className="flex h-screen bg-gray-50">

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <DashboardHeader />

                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto space-y-8">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Meus Médicos</h1>
                            <p className="text-gray-500 mt-1">Gerencie sua equipe médica e consultas.</p>
                        </div>
                        <DoctorsList userId={userId} />
                    </div>
                </main>
            </div>
        </div>
    )
}
