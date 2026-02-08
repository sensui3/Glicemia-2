import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
    try {
        const supabase = await createClient()

        // Chamamos o serviço de autenticação do Supabase. 
        // Isso gera tráfego para o projeto sem precisar consultar tabelas específicas do banco de dados.
        // O Supabase identifica isso como atividade no projeto e evita o "pause".
        const { data } = await supabase.auth.getSession()

        return NextResponse.json({
            status: "active",
            message: "Keep-alive signal sent to Supabase",
            timestamp: new Date().toISOString()
        })
    } catch (error) {
        console.error("Keep-alive error:", error)
        return NextResponse.json({ status: "error" }, { status: 500 })
    }
}
