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
import { Syringe, PillIcon, Activity, CalendarClock } from "lucide-react"

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

  // Dados da administração atual
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

  // Configuração de uso contínuo
  const [isContinuous, setIsContinuous] = useState(false)
  const [continuousDosage, setContinuousDosage] = useState("")
  const [continuousDosageUnit, setContinuousDosageUnit] = useState<string>("UI")

  // Reset dosage units when type changes
  useEffect(() => {
    if (medicationType.includes("insulina")) {
      setDosageUnit("UI")
      setContinuousDosageUnit("UI")
    } else if (dosageUnit === "UI") {
      setDosageUnit("mg")
      setContinuousDosageUnit("mg")
    }
  }, [medicationType])

  // Sync continuous dosage with current dosage initially if empty
  useEffect(() => {
    if (isContinuous && !continuousDosage && dosage) {
      setContinuousDosage(dosage)
    }
  }, [isContinuous, dosage])

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
        continuous_dosage: isContinuous && continuousDosage ? Number.parseFloat(continuousDosage) : null,
        continuous_dosage_unit: isContinuous ? continuousDosageUnit : null,
        is_active: isContinuous, // Novas medicações contínuas nascem ativas
      })

      if (error) throw error

      toast({
        title: "Medicação registrada!",
        description: isContinuous
          ? "Medicação registrada e configurada como uso contínuo."
          : "A medicação foi adicionada ao histórico.",
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
    setContinuousDosage("")
    setContinuousDosageUnit("UI")
  }

  const medicationTypes = [
    { value: "insulina_rapida", label: "Insulina Rápida", icon: Syringe },
    { value: "insulina_lenta", label: "Insulina Lenta", icon: Activity },
    { value: "insulina_intermediaria", label: "Insulina Intermediária", icon: Activity },
    { value: "insulina_basal", label: "Insulina Basal", icon: Activity },
    { value: "insulina_bolus", label: "Insulina Bolus", icon: Syringe },
    { value: "outro_medicamento", label: "Outro Medicamento", icon: PillIcon },
  ]

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

  const currentAvailableUnits = getAvailableUnits(medicationType)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
              <Syringe className="w-5 h-5 text-blue-700 dark:text-blue-400" />
            </div>
            Nova Medicação
          </DialogTitle>
          <DialogDescription>Registre uma aplicação ou configure um novo medicamento.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">

          {/* Seção 1: O que foi tomado */}
          <div className="space-y-4">
            <Label className="text-base font-semibold flex items-center gap-2">
              <PillIcon className="w-4 h-4" />
              Medicamento
            </Label>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {medicationTypes.map((type) => {
                const Icon = type.icon
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setMedicationType(type.value)}
                    className={`flex flex-col items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all h-24 ${medicationType === type.value
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                        : "border-border hover:border-blue-200 bg-card hover:bg-muted/50"
                      }`}
                  >
                    <Icon className={`w-6 h-6 ${medicationType === type.value ? "text-blue-500" : "text-muted-foreground"}`} />
                    <span className="text-xs font-medium text-center">{type.label}</span>
                  </button>
                )
              })}
            </div>

            <div>
              <Label htmlFor="medication_name">Nome Comercial</Label>
              <Input
                id="medication_name"
                placeholder="Ex: Lantus, Novorapid, Glifage..."
                value={medicationName}
                onChange={(e) => setMedicationName(e.target.value)}
                className="mt-1.5"
                required
              />
            </div>
          </div>

          <div className="h-px bg-border my-4" />

          {/* Seção 2: Detalhes da Aplicação (Ocorrência) */}
          <div className="space-y-4">
            <Label className="text-base font-semibold flex items-center gap-2">
              <CalendarClock className="w-4 h-4" />
              Registro do Evento
            </Label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Data</Label>
                  <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="time">Hora</Label>
                  <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required className="mt-1.5" />
                </div>
              </div>

              <div className="grid grid-cols-[1fr,110px] gap-2">
                <div>
                  <Label htmlFor="dosage">Dosagem Aplicada</Label>
                  <Input
                    id="dosage"
                    type="number"
                    step="0.1"
                    placeholder="0"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    required
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="dosage_unit">Unidade</Label>
                  <select
                    id="dosage_unit"
                    value={dosageUnit}
                    onChange={(e) => setDosageUnit(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring mt-1.5"
                    required
                  >
                    {currentAvailableUnits.map((unit) => (
                      <option key={unit.value} value={unit.value}>
                        {unit.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Seção 3: Uso Contínuo */}
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 rounded-xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex items-center h-6">
                <input
                  type="checkbox"
                  id="is_continuous"
                  checked={isContinuous}
                  onChange={(e) => setIsContinuous(e.target.checked)}
                  className="h-5 w-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="is_continuous" className="font-bold text-amber-900 dark:text-amber-500 cursor-pointer text-base">
                  Uso Contínuo / Diário
                </Label>
                <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                  Marque se este é um medicamento recorrente. Isso irá adicioná-lo à lista de monitoramento no painel.
                </p>
              </div>
            </div>

            {isContinuous && (
              <div className="pt-2 pl-8 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div>
                  <Label htmlFor="continuous_dosage" className="text-amber-900 dark:text-amber-500">Dosagem Padrão (Diária)</Label>
                  <div className="flex gap-2 mt-1.5">
                    <Input
                      id="continuous_dosage"
                      type="number"
                      step="0.1"
                      value={continuousDosage}
                      onChange={(e) => setContinuousDosage(e.target.value)}
                      className="bg-white dark:bg-black/20 border-amber-200 dark:border-amber-800 focus-visible:ring-amber-500"
                      placeholder="Ex: 20"
                    />
                    <select
                      value={continuousDosageUnit}
                      onChange={(e) => setContinuousDosageUnit(e.target.value)}
                      className="w-[110px] rounded-md border border-amber-200 dark:border-amber-800 bg-white dark:bg-black/20 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                    >
                      {currentAvailableUnits.map((unit) => (
                        <option key={unit.value} value={unit.value}>
                          {unit.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="notes">Observações (Opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Local de aplicação, sintomas ou outras notas..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1.5"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700">
              {loading ? "Salvando..." : "Salvar Registro"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
