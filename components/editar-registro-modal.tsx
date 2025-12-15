"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Droplet, Coffee, Utensils, Moon, MoreHorizontal, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { GlucoseReading } from "@/lib/types"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  reading: GlucoseReading | null
  onDataChange: () => void
}

function getMealFromTime(time: string): string {
  const hour = Number.parseInt(time.split(":")[0])

  if (hour >= 5 && hour < 10) return "Café da Manhã"
  if (hour >= 10 && hour < 15) return "Almoço"
  if (hour >= 15 && hour < 18) return "Lanche da Tarde"
  if (hour >= 18 && hour < 23) return "Jantar"
  return "Ceia"
}

const CONDITIONS = [
  { id: "jejum", label: "Jejum", icon: Coffee },
  { id: "antes_refeicao", label: "Antes Ref.", icon: Utensils },
  { id: "apos_refeicao", label: "Após Ref.", icon: Utensils },
  { id: "ao_dormir", label: "Ao Dormir", icon: Moon },
  { id: "outro", label: "Outro", icon: MoreHorizontal },
]

export function EditarRegistroModal({ open, onOpenChange, reading, onDataChange }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [selectedCondition, setSelectedCondition] = useState("jejum")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [value, setValue] = useState("")
  const [observations, setObservations] = useState("")

  const [detectedMeal, setDetectedMeal] = useState<string>("")

  useEffect(() => {
    if (reading) {
      setSelectedCondition(reading.condition)
      setDate(reading.reading_date)
      setTime(reading.reading_time)
      setValue(reading.reading_value.toString())
      setObservations(reading.observations || "")
    }
  }, [reading])

  useEffect(() => {
    if (selectedCondition === "antes_refeicao" || selectedCondition === "apos_refeicao") {
      setDetectedMeal(getMealFromTime(time))
    } else {
      setDetectedMeal("")
    }
  }, [time, selectedCondition])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reading) return

    setLoading(true)

    const supabase = createClient()

    const { error } = await supabase
      .from("glucose_readings")
      .update({
        reading_date: date,
        reading_time: time,
        condition: selectedCondition,
        reading_value: Number.parseInt(value),
        observations: observations || null,
      })
      .eq("id", reading.id)

    if (error) {
      toast({
        title: "Erro ao atualizar registro",
        description: error.message,
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    toast({
      title: "Registro atualizado com sucesso!",
      description: "Suas alterações foram salvas.",
    })

    onOpenChange(false)
    onDataChange()
    setLoading(false)
  }

  if (!reading) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 dark:bg-blue-900/40 rounded-full p-2">
              <Droplet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <DialogTitle className="text-xl">Editar Registro</DialogTitle>
              <p className="text-sm text-muted-foreground">Atualize as informações do registro</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Data e Hora */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Hora</Label>
              <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
            </div>
          </div>

          {/* Condição / Evento */}
          <div className="space-y-2">
            <Label>Condição / Evento</Label>
            <div className="grid grid-cols-5 gap-2">
              {CONDITIONS.map((condition) => {
                const Icon = condition.icon
                return (
                  <button
                    key={condition.id}
                    type="button"
                    onClick={() => setSelectedCondition(condition.id)}
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${selectedCondition === condition.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50 bg-card hover:bg-muted/50"
                      }`}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-xs font-medium">{condition.label}</span>
                  </button>
                )
              })}
            </div>
            {detectedMeal && (
              <div className="bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mt-2">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <span className="font-medium">Refeição detectada:</span> {detectedMeal}
                </p>
              </div>
            )}
          </div>

          {/* Resultado da Glicemia */}
          <div className="bg-muted/50 rounded-lg p-6">
            <Label className="text-sm text-muted-foreground mb-4 block">RESULTADO DA GLICEMIA</Label>
            <div className="flex items-end gap-2 mb-2">
              <Input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="000"
                required
                min="0"
                max="999"
                className="text-5xl font-bold h-20 text-center bg-background"
              />
              <span className="text-2xl font-medium text-muted-foreground mb-4">mg/dL</span>
            </div>
            <p className="text-xs text-muted-foreground text-center">Valores normais de jejum: 70-99 mg/dL</p>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observations">Observações (Opcional)</Label>
            <Textarea
              id="observations"
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="O que você comeu? Como se sente?"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700">
              <Save className="w-4 h-4 mr-2" />
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
