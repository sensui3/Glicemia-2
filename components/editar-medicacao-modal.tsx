"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Syringe, AlertCircle } from "lucide-react"
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

  // State
  const [notes, setNotes] = useState("")

  // Continuous configuration
  const [isContinuous, setIsContinuous] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const [continuousDosage, setContinuousDosage] = useState("")
  // We need to store unit, defaulting to medication's original unit or UI
  const [continuousDosageUnit, setContinuousDosageUnit] = useState("UI")

  useEffect(() => {
    if (open) {
      setNotes(medication.notes || "")
      setIsContinuous(medication.is_continuous)
      setIsActive(medication.is_active)

      if (medication.is_continuous && medication.continuous_dosage) {
        setContinuousDosage(medication.continuous_dosage.toString())
        setContinuousDosageUnit(medication.continuous_dosage_unit || "UI")
      } else {
        // If converting to continuous strings, start empty or with logs dosage? 
        // Better start with log dosage as hint
        setContinuousDosage(medication.dosage.toString())
        setContinuousDosageUnit(medication.dosage_unit)
      }
    }
  }, [medication, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()

      const updateData: any = {
        notes: notes || null,
        is_continuous: isContinuous,
        is_active: isActive,
        // Only update continuous dosage fields if it is continuous
        continuous_dosage: isContinuous ? Number.parseFloat(continuousDosage) : null,
        continuous_dosage_unit: isContinuous ? continuousDosageUnit : null,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from("medications")
        .update(updateData)
        .eq("id", medication.id)

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

  const getAvailableUnits = (type: string) => {
    if (type.includes("insulina")) {
      return [{ value: "UI", label: "UI (Unid. Internacionais)" }]
    }
    return [
      { value: "mg", label: "mg (Miligramas)" },
      { value: "ml", label: "ml (Mililitros)" },
      { value: "comprimido", label: "Comprimido" },
    ]
  }

  const currentAvailableUnits = getAvailableUnits(medication.medication_type)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
              <Syringe className="w-5 h-5 text-blue-700 dark:text-blue-400" />
            </div>
            Gerenciar Medicação
          </DialogTitle>
          <DialogDescription>
            Edite as configurações da medicação selecionada.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm text-foreground">
            <div className="flex justify-between">
              <span className="font-medium">Medicamento:</span>
              <span>{medication.medication_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Tipo:</span>
              <span>{medication.medication_type}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span className="font-medium">Registro Original:</span>
              <span>{new Date(medication.administration_date).toLocaleDateString()} às {medication.administration_time.slice(0, 5)}</span>
            </div>
          </div>

          <div className="space-y-4 border rounded-xl p-4 border-border">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Uso Contínuo</Label>
                <p className="text-sm text-muted-foreground">Medicação de uso recorrente</p>
              </div>
              <Switch
                checked={isContinuous}
                onCheckedChange={setIsContinuous}
              />
            </div>

            {isContinuous && (
              <div className="pt-2 animate-in fade-in slide-in-from-top-2">
                <Label htmlFor="continuous_dosage" className="text-sm font-medium mb-1.5 block">Dosagem Padrão (Diária)</Label>
                <div className="flex gap-2">
                  <Input
                    id="continuous_dosage"
                    type="number"
                    step="0.1"
                    value={continuousDosage}
                    onChange={(e) => setContinuousDosage(e.target.value)}
                    required={isContinuous}
                  />
                  <select
                    value={continuousDosageUnit}
                    onChange={(e) => setContinuousDosageUnit(e.target.value)}
                    className="w-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {currentAvailableUnits.map((unit) => (
                      <option key={unit.value} value={unit.value}>
                        {unit.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4 border rounded-xl p-4 border-border">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Status Ativo</Label>
                <p className="text-sm text-muted-foreground">Exibir no painel principal</p>
              </div>
              <Switch
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
            {!isActive && isContinuous && (
              <div className="flex items-center gap-2 text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-md text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Esta medicação será ocultada do widget de uso contínuo, mas permanecerá no histórico.</span>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Adicione observações..."
              className="mt-1.5"
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
