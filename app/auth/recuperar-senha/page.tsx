"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useState } from "react"
import { Activity, Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function RecuperarSenhaPage() {
    const [email, setEmail] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isSent, setIsSent] = useState(false)
    const { toast } = useToast()

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        const supabase = createClient()
        setIsLoading(true)

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/redefinir-senha`,
            })
            if (error) throw error

            setIsSent(true)
            toast({
                title: "E-mail enviado!",
                description: "Enviamos um link para redefinir sua senha.",
            })
        } catch (error: unknown) {
            toast({
                title: "Erro",
                description: error instanceof Error ? error.message : "Erro ao enviar e-mail",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#f8fafb] p-4 overflow-hidden">
            <div className="w-full max-w-[400px] animate-in fade-in zoom-in-95 duration-700 ease-out">
                <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50 p-7 md:p-9">
                    {/* Back Button */}
                    <Link
                        href="/auth/login"
                        className="inline-flex items-center text-[12px] text-gray-400 hover:text-teal-600 font-bold mb-6 transition-colors group"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                        VOLTAR PARA LOGIN
                    </Link>

                    {/* Header Section */}
                    <div className="flex flex-col items-center mb-7">
                        <div className="w-11 h-11 bg-teal-50 rounded-xl flex items-center justify-center mb-3 ring-4 ring-teal-50/50">
                            <Activity className="w-5 h-5 text-teal-600" />
                        </div>
                        <h1 className="text-xl font-black tracking-tight text-gray-900 text-center uppercase">
                            Recuperar Senha
                        </h1>
                        <p className="text-gray-500 text-[12px] mt-2 text-center font-medium max-w-[280px]">
                            {isSent
                                ? "Tudo pronto! Verifique sua caixa de entrada para continuar."
                                : "Informe seu e-mail e enviaremos um link para você definir uma nova senha."}
                        </p>
                    </div>

                    {!isSent ? (
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="email" className="text-[12px] font-bold uppercase tracking-widest text-gray-400 ml-1">
                                    E-mail de Cadastro
                                </Label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-teal-600 transition-colors" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="seu@email.com"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-11 h-11 !bg-white !border-gray-300 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 rounded-xl transition-all duration-200 text-[12px] text-black placeholder:text-gray-300 shadow-none"
                                        spellCheck={false}
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-11 bg-teal-600 hover:bg-teal-700 text-white text-[12px] font-bold rounded-xl shadow-lg shadow-teal-600/20 active:scale-[0.98] transition-all duration-200 mt-2"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    "Enviar Link de Recuperação"
                                )}
                            </Button>
                        </form>
                    ) : (
                        <div className="bg-teal-50/50 border border-teal-100 rounded-2xl p-6 flex flex-col items-center text-center">
                            <CheckCircle2 className="w-10 h-10 text-teal-600 mb-3" />
                            <p className="text-[14px] text-teal-900 font-bold mb-1">E-mail Enviado!</p>
                            <p className="text-[12px] text-teal-700/70 font-medium">
                                Não recebeu? Verifique sua pasta de spam ou tente novamente em alguns minutos.
                            </p>
                            <Button
                                onClick={() => setIsSent(false)}
                                className="mt-5 text-[11px] font-bold text-teal-600 bg-transparent hover:bg-teal-50 uppercase tracking-widest"
                            >
                                Tentar outro e-mail
                            </Button>
                        </div>
                    )}
                </div>

                {/* Footer info */}
                <p className="text-center text-[9px] text-gray-400 mt-5 uppercase tracking-[0.2em] font-bold">
                    &copy; {new Date().getFullYear()} Controle de Glicemia
                </p>
            </div>
        </div>
    )
}
