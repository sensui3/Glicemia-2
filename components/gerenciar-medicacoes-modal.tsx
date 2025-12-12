"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import type { Medication } from "@/lib/types"
import { getMedicationTypeLabel } from "@/lib/types"
import { Pill } from "lucide-react"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  onSuccess: () => void
}

export function GerenciarMedicacoesModal({ open, onOpenChange, userId, onSuccess }: Props) {
  const [medications, setMedications] = useState<Medication[]>([])
  const [selectedMeds, setSelectedMeds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      loadMedications()
    }
  }, [open, userId])

  const loadMedications = async () => {
    const supabase = createClient()

    const { data } = await supabase
      .from("medications")
      .select("*")
      .eq("user_id", userId)
      .eq("is_continuous", true)
      .eq("is_active", true)
      .order("medication_name")

    const meds = (data as Medication[]) || []
    setMedications(meds)

    const selected = new Set(meds.filter((m) => m.show_in_dashboard).map((m) => m.id))
    setSelectedMeds(selected)
  }

  const handleToggle = (medId: string) => {
    const newSelected = new Set(selectedMeds)
    if (newSelected.has(medId)) {
      newSelected.delete(medId)
    } else {
      newSelected.add(medId)
    }
    setSelectedMeds(newSelected)
  }

  const handleSave = async () => {
    setLoading(true)
    const supabase = createClient()

    try {
      for (const med of medications) {
        const shouldShow = selectedMeds.has(med.id)
        await supabase.from("medications").update({ show_in_dashboard: shouldShow }).eq("id", med.id)
      }

      toast({
        title: "Medicações atualizadas!",
        description: "As medicações exibidas no dashboard foram atualizadas.",
      })

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("Erro ao atualizar medicações:", error)
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar as medicações.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="bg-amber-100 p-2 rounded-lg">
              <Pill className="w-5 h-5 text-amber-700" />
            </div>
            Gerenciar Medicações no Dashboard
          </DialogTitle>
          <DialogDescription>
            Selecione quais medicações de uso contínuo devem aparecer no painel principal.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {medications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhuma medicação de uso contínuo ativa encontrada.</p>
              <p className="text-sm mt-2">Adicione medicações de uso contínuo na seção de Medicações.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {medications.map((med) => (
                <div
                  key={med.id}
                  className="flex items-start gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Checkbox
                    id={med.id}
                    checked={selectedMeds.has(med.id)}
                    onCheckedChange={() => handleToggle(med.id)}
                    className="mt-1"
                  />
                  <label htmlFor={med.id} className="flex-1 cursor-pointer">
                    <div className="font-semibold">{med.medication_name}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                        {getMedicationTypeLabel(med.medication_type)}
                      </span>
                      {med.continuous_dosage} {med.continuous_dosage_unit} • {med.administration_time.slice(0, 5)}
                    </div>
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700">
            {loading ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
