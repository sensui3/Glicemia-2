"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"

export function LogoutButton() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)

    try {
      const supabase = createClient()
      await supabase.auth.signOut()

      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso",
      })

      router.push("/auth/login")
      router.refresh()
    } catch (error) {
      toast({
        title: "Erro ao sair",
        description: "Não foi possível fazer logout. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button variant="ghost" size="icon" onClick={handleLogout} disabled={isLoading}>
      <LogOut className="w-5 h-5" />
    </Button>
  )
}
