"use client"

import { useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

export type FoodItem = {
    id: string
    nome: string
    categoria: string
    carboidratos_por_100g: number
    fiber_g?: number
    protein_g?: number
    fat_g?: number
    calories_kCal?: number
    indice_glicemico?: number
    criado_por_user_id?: string | null
}

export function useFoodData() {
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)
    const [searchResults, setSearchResults] = useState<FoodItem[]>([])

    const searchFoods = useCallback(async (query: string) => {
        if (!query || query.length < 2) {
            setSearchResults([])
            return
        }

        setLoading(true)
        const supabase = createClient()

        try {
            const { data: { user } } = await supabase.auth.getUser()

            // Simple implementation: fetch matching foods that are either public or owned by user
            const { data, error } = await supabase
                .from("alimentos_base")
                .select("*")
                .or(`criado_por_user_id.is.null,criado_por_user_id.eq.${user?.id}`)
                .ilike("nome", `%${query}%`)
                .order("nome")
                .limit(20)

            if (error) throw error

            setSearchResults(data || [])
        } catch (error: any) {
            console.error("Error searching foods:", error)
            toast({
                title: "Erro na busca",
                description: "Não foi possível buscar os alimentos.",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }, [toast])

    const createCustomFood = async (food: Omit<FoodItem, "id" | "created_at">) => {
        setLoading(true)
        const supabase = createClient()

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("User not authenticated")

            const { data, error } = await supabase
                .from("alimentos_base")
                .insert({
                    ...food,
                    criado_por_user_id: user.id
                })
                .select()
                .single()

            if (error) throw error

            toast({
                title: "Alimento criado",
                description: `${food.nome} foi adicionado à sua lista.`,
            })

            return data
        } catch (error: any) {
            console.error("Error creating food:", error)
            toast({
                title: "Erro ao criar",
                description: error.message || "Não foi possível criar o alimento.",
                variant: "destructive",
            })
            return null
        } finally {
            setLoading(false)
        }
    }

    return {
        loading,
        searchResults,
        searchFoods,
        createCustomFood
    }
}
