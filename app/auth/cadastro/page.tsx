"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Activity, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function CadastroPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError("As senhas não coincidem")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres")
      setIsLoading(false)
      return
    }

    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${origin}/dashboard`,
        },
      })
      if (error) throw error

      toast({
        title: "Conta criada com sucesso!",
        description: "Verifique seu email para confirmar sua conta.",
      })

      router.push("/auth/verificar-email")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Erro ao criar conta")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8fafb] p-4 overflow-hidden">
      <div className="w-full max-w-[420px] animate-in fade-in zoom-in-95 duration-700 ease-out">
        <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50 p-7 md:p-9">
          {/* Logo Section */}
          <div className="flex flex-col items-center mb-5">
            <div className="w-11 h-11 bg-teal-50 rounded-xl flex items-center justify-center mb-3 ring-4 ring-teal-50/50">
              <Activity className="w-5 h-5 text-teal-600" />
            </div>
            <h1 className="text-xl font-black tracking-tight text-gray-900 text-center uppercase">
              Controle de Glicemia
            </h1>
            <p className="text-gray-500 text-[12px] mt-1 text-center font-medium">
              Crie sua conta para começar a monitorar
            </p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[12px] font-bold uppercase tracking-widest text-gray-400 ml-1">
                Email
              </Label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-teal-600 transition-colors" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="exemplo@email.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-11 h-11 !bg-white !border-gray-300 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 rounded-xl transition-all duration-200 text-[12px] text-black placeholder:text-gray-300 shadow-none"
                  spellCheck={false}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" title="password" className="text-[12px] font-bold uppercase tracking-widest text-gray-400 ml-1">
                Senha
              </Label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-teal-600 transition-colors" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-11 pr-11 h-11 !bg-white !border-gray-300 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 rounded-xl transition-all duration-200 text-[12px] text-black placeholder:text-gray-300 shadow-none"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-teal-600 transition-colors"
                  aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm-password" title="confirm-password" className="text-[12px] font-bold uppercase tracking-widest text-gray-400 ml-1">
                Confirmar Senha
              </Label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-teal-600 transition-colors" />
                <Input
                  id="confirm-password"
                  name="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-11 pr-11 h-11 !bg-white !border-gray-300 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 rounded-xl transition-all duration-200 text-[12px] text-black placeholder:text-gray-300 shadow-none"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-teal-600 transition-colors"
                  aria-label={showConfirmPassword ? "Esconder senha" : "Mostrar senha"}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-2.5 rounded-xl text-[11px] font-bold uppercase tracking-tight text-center border border-red-100">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 bg-teal-600 hover:bg-teal-700 text-white text-[12px] font-bold rounded-xl shadow-lg shadow-teal-600/20 active:scale-[0.98] transition-all duration-200 mt-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Criar Minha Conta"
              )}
            </Button>
          </form>

          <div className="mt-5 pt-5 border-t border-gray-50 flex flex-col items-center">
            <p className="text-[12px] text-gray-400 font-medium">
              Já tem uma conta?
            </p>
            <Link
              href="/auth/login"
              className="mt-1 text-[12px] text-teal-600 font-bold hover:text-teal-700 transition-colors"
            >
              Fazer login agora
            </Link>
          </div>
        </div>

        {/* Footer info - simplified/smaller */}
        <p className="text-center text-[9px] text-gray-400 mt-5 uppercase tracking-[0.2em] font-bold">
          &copy; {new Date().getFullYear()} Controle de Glicemia
        </p>
      </div>
    </div>
  )
}
