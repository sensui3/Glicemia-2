"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Syringe } from "lucide-react"
import type { Medication } from "@/lib/types"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  medication: Medication
  onSuccess: () => void
}

export function EditarMedicacaoModal({ open, onOpenChange, medication, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const [dosage, setDosage] = useState(medication.continuous_dosage?.toString() || medication.dosage.toString())
  const [notes, setNotes] = useState(medication.notes || "")

  useEffect(() => {
    setDosage(medication.continuous_dosage?.toString() || medication.dosage.toString())
    setNotes(medication.notes || "")
  }, [medication])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()

      const updateData: any = {
        notes: notes || null,
      }

      if (medication.is_continuous) {
        updateData.continuous_dosage = Number.parseFloat(dosage)
      } else {
        updateData.dosage = Number.parseFloat(dosage)
      }

      const { error } = await supabase.from("medications").update(updateData).eq("id", medication.id)

      if (error) throw error

      toast({
        title: "Medicação atualizada!",
        description: "As alterações foram salvas com sucesso.",
      })

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("Erro ao atualizar medicação:", error)
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar a medicação. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Syringe className="w-5 h-5 text-blue-700" />
            </div>
            Editar Medicação
          </DialogTitle>
          <DialogDescription>
            Atualize a dosagem{medication.is_continuous && " padrão"} ou observações.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
            <div>
              <span className="font-medium">Nome:</span> {medication.medication_name}
            </div>
            <div>
              <span className="font-medium">Tipo:</span> {medication.medication_type}
            </div>
          </div>

          <div>
            <Label htmlFor="dosage">Dosagem {medication.is_continuous && "(Padrão)"}</Label>
            <div className="flex gap-2">
              <Input
                id="dosage"
                type="number"
                step="0.1"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                required
                className="flex-1"
              />
              <div className="flex items-center px-3 bg-gray-100 rounded-md text-sm font-medium">
                {medication.dosage_unit}
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Adicione observações sobre a medicação..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700">
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
