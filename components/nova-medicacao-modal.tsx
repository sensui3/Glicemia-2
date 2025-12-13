"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Syringe, PillIcon, Activity } from "lucide-react"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  onSuccess: () => void
}

export function NovaMedicacaoModal({ open, onOpenChange, userId, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const [medicationName, setMedicationName] = useState("")
  const [medicationType, setMedicationType] = useState<string>("insulina_rapida")
  const [dosage, setDosage] = useState("")
  const [dosageUnit, setDosageUnit] = useState<string>("UI")
  const [date, setDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split("T")[0]
  })
  const [time, setTime] = useState(() => {
    const now = new Date()
    return now.toTimeString().slice(0, 5)
  })
  const [notes, setNotes] = useState("")
  const [isContinuous, setIsContinuous] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()

      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData?.user) {
        throw new Error("Usuário não autenticado")
      }

      const { error } = await supabase.from("medications").insert({
        user_id: userId,
        medication_name: medicationName,
        medication_type: medicationType,
        dosage: Number.parseFloat(dosage),
        dosage_unit: dosageUnit,
        administration_date: date,
        administration_time: time,
        notes: notes || null,
        is_continuous: isContinuous,
        continuous_dosage: isContinuous ? Number.parseFloat(dosage) : null,
        continuous_dosage_unit: isContinuous ? dosageUnit : null,
        is_active: isContinuous,
      })

      if (error) throw error

      toast({
        title: "Medicação registrada!",
        description: isContinuous
          ? "A medicação de uso contínuo foi configurada com sucesso."
          : "A medicação foi adicionada com sucesso.",
      })

      onSuccess()
      onOpenChange(false)
      resetForm()
    } catch (error) {
      console.error("Erro ao salvar medicação:", error)
      toast({
        title: "Erro ao registrar",
        description: "Não foi possível registrar a medicação. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setMedicationName("")
    setMedicationType("insulina_rapida")
    setDosage("")
    setDosageUnit("UI")
    const today = new Date()
    setDate(today.toISOString().split("T")[0])
    setTime(new Date().toTimeString().slice(0, 5))
    setNotes("")
    setIsContinuous(false)
  }

  const medicationTypes = [
    { value: "insulina_rapida", label: "Insulina Rápida", icon: Syringe },
    { value: "insulina_lenta", label: "Insulina Lenta", icon: Activity },
    { value: "insulina_intermediaria", label: "Insulina Intermediária", icon: Activity },
    { value: "insulina_basal", label: "Insulina Basal", icon: Activity },
    { value: "insulina_bolus", label: "Insulina Bolus", icon: Syringe },
    { value: "outro_medicamento", label: "Outro Medicamento", icon: PillIcon },
  ]

  const dosageUnits = [
    { value: "UI", label: "UI (Unidades Internacionais)" },
    { value: "mg", label: "mg (Miligramas)" },
    { value: "ml", label: "ml (Mililitros)" },
    { value: "comprimido", label: "Comprimido" },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Syringe className="w-5 h-5 text-blue-700" />
            </div>
            Nova Medicação
          </DialogTitle>
          <DialogDescription>Registre insulinas e outros medicamentos.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="is_continuous"
                checked={isContinuous}
                onChange={(e) => setIsContinuous(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <Label htmlFor="is_continuous" className="font-semibold text-amber-900 cursor-pointer">
                  Medicação de Uso Contínuo
                </Label>
                <p className="text-sm text-amber-700 mt-1">
                  Marque esta opção para medicações que você usa diariamente com dosagem fixa (ex: Insulina Glargina
                  30u). Você poderá ajustar a dosagem quando necessário.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Data {isContinuous && "(Início do uso contínuo)"}</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="time">Hora {isContinuous && "(Horário habitual)"}</Label>
              <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
            </div>
          </div>

          <div>
            <Label className="mb-3 block">Tipo de Medicação</Label>
            <div className="grid grid-cols-2 gap-3">
              {medicationTypes.map((type) => {
                const Icon = type.icon
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => {
                      setMedicationType(type.value)
                      if (type.value.includes("insulina")) {
                        setDosageUnit("UI")
                      }
                    }}
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${medicationType === type.value
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 hover:border-gray-300"
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{type.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <Label htmlFor="medication_name">Nome da Medicação</Label>
            <Input
              id="medication_name"
              placeholder="Ex: Novorapid, Lantus, Metformina..."
              value={medicationName}
              onChange={(e) => setMedicationName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dosage">Dosagem {isContinuous && "(Padrão)"}</Label>
              <Input
                id="dosage"
                type="number"
                step="0.1"
                placeholder="Ex: 10"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="dosage_unit">Unidade</Label>
              <select
                id="dosage_unit"
                value={dosageUnit}
                onChange={(e) => setDosageUnit(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
              >
                {dosageUnits.map((unit) => (
                  <option key={unit.value} value={unit.value}>
                    {unit.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Observações (Opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Ex: Tomado antes do café da manhã, local da aplicação..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700">
              {loading ? "Salvando..." : isContinuous ? "Configurar Uso Contínuo" : "Salvar Medicação"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
