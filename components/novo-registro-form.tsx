"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { X, Calendar, Clock, Droplet, Coffee, Utensils, Moon, MoreHorizontal, Save, Info, Activity } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useAddGlucoseReading } from "@/hooks/use-glucose-unified"

type Props = {
  userId: string
}

const conditions = [
  { value: "jejum", label: "Jejum", icon: Coffee },
  { value: "antes_refeicao", label: "Antes Ref.", icon: Utensils },
  { value: "apos_refeicao", label: "Após Ref.", icon: Utensils },
  { value: "ao_dormir", label: "Ao Dormir", icon: Moon },
  { value: "outro", label: "Outro", icon: MoreHorizontal },
]

export function NovoRegistroForm({ userId }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const { mutate: addReading, isPending: isSubmitting } = useAddGlucoseReading()

  // Custom loading state for UI feedback if needed, but mutation provides it
  const isLoading = isSubmitting
  // State Definitions
  const today = new Date()
  const localDate = today.toLocaleDateString('en-CA')
  const localTime = today.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false })
  const [date, setDate] = useState(localDate)
  const [time, setTime] = useState(localTime)
  const [condition, setCondition] = useState<string>("jejum")
  const [value, setValue] = useState<string>("")
  const [carbs, setCarbs] = useState<string>("")
  const [calories, setCalories] = useState<string>("")
  const [observations, setObservations] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const numValue = Number.parseInt(value)
    if (!value || isNaN(numValue)) {
      setError("Por favor, insira um valor válido de glicemia")
      return
    }

    if (numValue < 20 || numValue > 600) {
      setError("O valor da glicemia deve estar entre 20 e 600 mg/dL")
      return
    }

    if (numValue > 180) {
      toast({
        title: "Dica de Saúde",
        description: "Glicemia alta? Lembre-se de beber água para ajudar a regular os níveis.",
        duration: 5000,
      })
    }

    addReading({
      user_id: userId,
      reading_value: numValue,
      reading_date: date,
      reading_time: time,
      condition: condition as any,
      carbs: carbs ? Number.parseInt(carbs) : null,
      calories: calories ? Number.parseInt(calories) : null,
      observations: observations || null,
    }, {
      onSuccess: () => {
        router.push("/dashboard")
        // router.refresh() // No longer needed as we invalidate cache and use client data, but if server components depend on it, we might keep it. Ideally we rely on React Query cache now.
      },
      onError: (err) => {
        setError(err.message)
      }
    })
  }

  return (
    <div className="bg-card rounded-2xl shadow-sm p-6 border border-border">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl">
            <Droplet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Novo Registro</h1>
            <p className="text-sm text-muted-foreground">Adicione uma nova leitura de glicemia</p>
          </div>
        </div>
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" aria-label="Fechar formulário">
            <X className="w-5 h-5" />
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Data e Hora */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Data
            </Label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="time" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Hora
            </Label>
            <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
          </div>
        </div>

        {/* Condição / Evento */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Droplet className="w-4 h-4" />
            Condição / Evento
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-gray-400 cursor-pointer" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Selecione o momento da medição para melhor controle.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {conditions.map((cond) => {
              const Icon = cond.icon
              return (
                <button
                  key={cond.value}
                  type="button"
                  onClick={() => setCondition(cond.value)}
                  aria-pressed={condition === cond.value}
                  aria-label={`Selecionar condição: ${cond.label}`}
                  className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${condition === cond.value ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-border hover:border-blue-200 dark:hover:border-blue-800"
                    }`}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-sm font-medium">{cond.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Resultado da Glicemia */}
        <div className="space-y-2">
          <Label htmlFor="value" className="text-base font-semibold uppercase text-muted-foreground flex items-center gap-2">
            Resultado da Glicemia
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-muted-foreground cursor-pointer" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Insira o valor exato mostrado no seu glicosímetro.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <div className="bg-muted rounded-xl p-8">
            <div className="flex items-center justify-center gap-4">
              <Input
                id="value"
                type="number"
                min="0"
                max="999"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="000"
                className="text-6xl font-bold text-center w-48 h-24 text-muted-foreground bg-card border-border"
                required
                aria-describedby="glucose-helper-text"
              />
              <span className="text-2xl font-medium text-muted-foreground">mg/dL</span>
            </div>
            <p id="glucose-helper-text" className="text-center text-sm text-muted-foreground mt-4">Valores normais de jejum: 70-99 mg/dL</p>
          </div>
        </div>

        {/* Nutrition Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="carbs" className="flex items-center gap-2">
              <Utensils className="w-4 h-4" />
              Carboidratos (g)
            </Label>
            <Input
              id="carbs"
              type="number"
              placeholder="Ex: 45"
              value={carbs}
              onChange={(e) => setCarbs(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="calories" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Calorias (kcal)
            </Label>
            <Input
              id="calories"
              type="number"
              placeholder="Ex: 350"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
            />
          </div>
        </div>

        {/* Observações */}
        <div className="space-y-2">
          <Label htmlFor="observations">Observações (Opcional)</Label>
          <Textarea
            id="observations"
            placeholder="O que você comeu? Como se sente?"
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            rows={4}
          />
        </div>

        {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">{error}</div>}

        {/* Ações */}
        <div className="flex gap-3">
          <Link href="/dashboard" className="flex-1">
            <Button type="button" variant="outline" className="w-full bg-transparent">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? "Salvando..." : "Salvar Registro"}
          </Button>
        </div>
      </form>
    </div>
  )
}
