"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ConfiguracoesModal({ open, onOpenChange }: Props) {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      loadUserData()
    }
  }, [open])

  const loadUserData = async () => {
    setIsLoading(true)
    const supabase = createClient()
    const { data } = await supabase.auth.getUser()
    if (data.user) {
      setEmail(data.user.email || "")
    }
    setIsLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Configurações</DialogTitle>
          <DialogDescription>Gerencie as configurações da sua conta</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
            </div>
          ) : (
            <>
              {/* Informações da Conta */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} disabled className="mt-1.5" />
                  <p className="text-xs text-gray-500 mt-1">O email não pode ser alterado no momento</p>
                </div>
              </div>

              {/* Valores de Referência */}
              <div className="space-y-3 pt-4 border-t">
                <h3 className="font-medium text-sm">Valores de Referência</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Jejum (Normal):</span>
                    <span className="font-medium">70-99 mg/dL</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Jejum (Pré-diabetes):</span>
                    <span className="font-medium">100-125 mg/dL</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Jejum (Diabetes):</span>
                    <span className="font-medium">≥126 mg/dL</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Após refeição (Normal):</span>
                    <span className="font-medium">&lt;140 mg/dL</span>
                  </div>
                </div>
              </div>

              {/* Informações do App */}
              <div className="space-y-2 pt-4 border-t">
                <h3 className="font-medium text-sm">Sobre o App</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Versão: 1.0.0</p>
                  <p>Controle de Glicemia</p>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={() => onOpenChange(false)}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
