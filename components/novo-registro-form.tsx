"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { X, Calendar, Clock, Droplet, Coffee, Utensils, Moon, MoreHorizontal, Save } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"

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
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Estados do formulário
  const today = new Date()
  const localDate = today.toLocaleDateString('en-CA') // yyyy‑mm‑dd, matches HTML date input
  const localTime = today.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false })
  const [date, setDate] = useState(localDate)
  const [time, setTime] = useState(localTime)
  const [condition, setCondition] = useState<string>("jejum")
  const [value, setValue] = useState<string>("")
  const [observations, setObservations] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!value || Number.parseInt(value) <= 0) {
      setError("Por favor, insira um valor válido de glicemia")
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()

      const { error: insertError } = await supabase.from("glucose_readings").insert({
        user_id: userId,
        reading_value: Number.parseInt(value),
        reading_date: date,
        reading_time: time,
        condition,
        observations: observations || null,
      })

      if (insertError) throw insertError

      router.push("/dashboard")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar registro")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-3 rounded-xl">
            <Droplet className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Novo Registro</h1>
            <p className="text-sm text-gray-500">Adicione uma nova leitura de glicemia</p>
          </div>
        </div>
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
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
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {conditions.map((cond) => {
              const Icon = cond.icon
              return (
                <button
                  key={cond.value}
                  type="button"
                  onClick={() => setCondition(cond.value)}
                  className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${condition === cond.value ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
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
          <Label htmlFor="value" className="text-base font-semibold uppercase text-gray-600">
            Resultado da Glicemia
          </Label>
          <div className="bg-gray-50 rounded-xl p-8">
            <div className="flex items-center justify-center gap-4">
              <Input
                id="value"
                type="number"
                min="0"
                max="999"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="000"
                className="text-6xl font-bold text-center w-48 h-24 text-gray-400 bg-white"
                required
              />
              <span className="text-2xl font-medium text-gray-500">mg/dL</span>
            </div>
            <p className="text-center text-sm text-gray-500 mt-4">Valores normais de jejum: 70-99 mg/dL</p>
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

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}

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
