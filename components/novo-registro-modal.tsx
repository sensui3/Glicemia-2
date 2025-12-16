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
import { Droplet, Coffee, Utensils, Moon, MoreHorizontal, Save, Activity, Timer, Flame, Footprints, Plus, Trash2, Apple, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { FoodSearchCombobox } from "@/components/food-search-combobox"
import { FoodItem } from "@/hooks/use-food-data"
import { useGlucosePrediction } from "@/hooks/use-glucose-prediction"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDataChange: () => void
  initialCondition?: string | null
}

const CONDITIONS = [
  { id: "jejum", label: "Jejum", icon: Coffee },
  { id: "antes_refeicao", label: "Antes Ref.", icon: Utensils },
  { id: "apos_refeicao", label: "Após Ref.", icon: Utensils },
  { id: "ao_dormir", label: "Ao Dormir", icon: Moon },
  { id: "outro", label: "Outro", icon: MoreHorizontal },
]

function getMealFromTime(time: string): string {
  const hour = Number.parseInt(time.split(":")[0])

  if (hour >= 5 && hour < 10) return "Café da Manhã"
  if (hour >= 10 && hour < 15) return "Almoço"
  if (hour >= 15 && hour < 18) return "Lanche da Tarde"
  if (hour >= 18 && hour < 23) return "Jantar"
  return "Ceia"
}

function getMealTypeSlug(mealName: string): string | null {
  const map: Record<string, string> = {
    "Café da Manhã": "cafe_manha",
    "Almoço": "almoco",
    "Lanche da Tarde": "lanche",
    "Jantar": "jantar",
    "Ceia": "lanche"
  };
  return map[mealName] || null;
}

export function NovoRegistroModal({ open, onOpenChange, onDataChange, initialCondition }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  // Initialize with template or localStorage or default 'jejum'
  const [selectedCondition, setSelectedCondition] = useState("jejum")

  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [time, setTime] = useState(
    new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", hour12: false }),
  )
  const [value, setValue] = useState("")
  const [observations, setObservations] = useState("")
  const [detectedMeal, setDetectedMeal] = useState<string>("")

  // Activity Fields
  const [showActivity, setShowActivity] = useState(false)
  const [activityType, setActivityType] = useState("")
  const [activityDuration, setActivityDuration] = useState("")
  const [activityIntensity, setActivityIntensity] = useState<"baixa" | "moderada" | "alta" | "">("")
  const [activityMoment, setActivityMoment] = useState<"antes_medicao" | "durante_atividade" | "apos_atividade" | "">("")
  const [steps, setSteps] = useState("")

  // Food Journal Fields
  const [showFood, setShowFood] = useState(false)
  const [selectedFoods, setSelectedFoods] = useState<(FoodItem & { portion: number })[]>([])
  const [manualCarbs, setManualCarbs] = useState("")

  const { predictImpact, prediction, loading: predictionLoading } = useGlucosePrediction()

  useEffect(() => {
    const timer = setTimeout(() => {
      if (selectedFoods.length > 0) {
        predictImpact(selectedFoods)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [selectedFoods, predictImpact])

  const calculateTotalCarbs = () => {
    return Math.round(selectedFoods.reduce((acc, curr) => acc + (curr.carboidratos_por_100g * curr.portion) / 100, 0))
  }

  // Effect to handle open state updates (Templates or Auto-fill)
  useEffect(() => {
    if (open) {
      if (initialCondition) {
        setSelectedCondition(initialCondition)
      } else {
        // Auto-fill: Try to load last used condition from localStorage
        // Only if no specific template was requested
        const lastCondition = localStorage.getItem("last_glucose_condition")
        if (lastCondition) {
          setSelectedCondition(lastCondition)
        }
      }

      // Reset inputs slightly
      setDate(new Date().toISOString().split("T")[0])
      setTime(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", hour12: false }))
      setValue("")
      setObservations("")
      setShowActivity(false)
      setActivityType("")
      setActivityDuration("")
      setActivityIntensity("")
      setActivityMoment("")
      setActivityMoment("")
      setSteps("")
      setShowFood(false)
      setSelectedFoods([])
      setManualCarbs("")
    }
  }, [open, initialCondition])

  useEffect(() => {
    if (selectedCondition === "antes_refeicao" || selectedCondition === "apos_refeicao") {
      setDetectedMeal(getMealFromTime(time))
    } else {
      setDetectedMeal("")
    }
  }, [time, selectedCondition])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        toast({
          title: "Erro de autenticação",
          description: "Você precisa estar logado para adicionar registros.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      const dataToInsert = {
        reading_date: date,
        reading_time: time,
        condition: selectedCondition,
        reading_value: Number.parseInt(value),
        observations: observations || null,
        user_id: user.id,
        // Activity fields
        activity_type: showActivity && activityType ? activityType : null,
        activity_duration_minutes: showActivity && activityDuration ? Number.parseInt(activityDuration) : null,
        activity_intensity: showActivity && activityIntensity ? activityIntensity : null,
        activity_moment: showActivity && activityMoment ? activityMoment : null,
        steps_count: steps ? Number.parseInt(steps) : null,
        // Food fields
        refeicao_tipo: detectedMeal ? getMealTypeSlug(detectedMeal) : null,
        alimentos_consumidos: selectedFoods.map(f => ({
          nome: f.nome,
          porcao_g: f.portion,
          carboidratos_g: (f.carboidratos_por_100g * f.portion) / 100
        })),
        carbs: calculateTotalCarbs() || (manualCarbs ? Number.parseInt(manualCarbs) : null)
      }

      const { error } = await supabase.from("glucose_readings").insert(dataToInsert).select()

      if (error) {
        throw error
      }

      // Save condition to localStorage for next auto-fill
      localStorage.setItem("last_glucose_condition", selectedCondition)

      toast({
        title: "Registro salvo com sucesso!",
        description: "Seu registro de glicemia foi adicionado.",
      })

      onOpenChange(false)
      onDataChange()

      // Reset form handled by effect on open mostly, but good to clear value
      setValue("")
    } catch (err: any) {
      console.error("[v0] Error in handleSubmit:", err)
      toast({
        title: "Erro ao salvar",
        description: err.message || "Ocorreu um erro ao salvar o registro.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-full p-2">
              <Droplet className="w-6 h-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">Novo Registro</DialogTitle>
              <p className="text-sm text-muted-foreground">Adicione uma nova leitura de glicemia</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Data e Hora */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="h-12" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Hora</Label>
              <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required className="h-12" />
            </div>
          </div>

          {/* Condição / Evento */}
          <div className="space-y-2">
            <Label>Condição / Evento</Label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {CONDITIONS.map((condition) => {
                const Icon = condition.icon
                return (
                  <button
                    key={condition.id}
                    type="button"
                    onClick={() => setSelectedCondition(condition.id)}
                    className={`flex flex-col items-center justify-center gap-2 p-3 h-24 rounded-lg border-2 transition-all ${selectedCondition === condition.id
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/50 bg-card"
                      }`}
                    aria-pressed={selectedCondition === condition.id}
                  >
                    <Icon className={`w-6 h-6 ${selectedCondition === condition.id ? "text-primary" : "text-muted-foreground"}`} />
                    <span className={`text-xs font-medium ${selectedCondition === condition.id ? "text-primary" : "text-muted-foreground"}`}>{condition.label}</span>
                  </button>
                )
              })}
            </div>
            {detectedMeal && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mt-2">
                <p className="text-sm text-primary">
                  <span className="font-medium">Refeição detectada:</span> {detectedMeal}
                </p>
              </div>
            )}
          </div>

          {/* Resultado da Glicemia */}
          <div className="bg-muted/50 border rounded-xl p-6">
            <Label className="text-sm font-semibold text-muted-foreground mb-4 block uppercase tracking-wide">Valor da Glicemia</Label>
            <div className="flex items-center justify-center gap-4 mb-2">
              <Input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="---"
                required
                min="0"
                max="999"
                autoFocus
                className="text-6xl font-bold h-24 w-48 text-center bg-background border-2 focus-visible:ring-primary shadow-sm rounded-xl"
              />
              <span className="text-xl font-medium text-muted-foreground self-end mb-6">mg/dL</span>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              {selectedCondition === 'jejum' ? 'Meta: 70-99 mg/dL' : 'Meta pós-refeição: <140 mg/dL'}
            </p>
          </div>

          {/* Activity Section Toggle */}
          <div className="border rounded-xl p-4 bg-muted/20">
            <button
              type="button"
              onClick={() => setShowActivity(!showActivity)}
              className="flex items-center gap-2 w-full text-left font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Activity className="w-5 h-5" />
              <span>Registrar Atividade Física?</span>
              <span className="ml-auto text-xs bg-muted px-2 py-1 rounded-full">{showActivity ? "Sim" : "Não"}</span>
            </button>

            {showActivity && (
              <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Input
                      placeholder="Ex: Corrida, Caminhada"
                      value={activityType}
                      onChange={(e) => setActivityType(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Duração (min)</Label>
                    <div className="relative">
                      <Timer className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="0"
                        className="pl-9"
                        value={activityDuration}
                        onChange={(e) => setActivityDuration(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Intensidade</Label>
                  <div className="flex gap-2">
                    {(["baixa", "moderada", "alta"] as const).map((intensity) => (
                      <button
                        key={intensity}
                        type="button"
                        onClick={() => setActivityIntensity(intensity)}
                        className={`flex-1 py-2 text-xs font-medium rounded-md border transition-all ${activityIntensity === intensity
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background hover:bg-muted"
                          }`}
                      >
                        {intensity === "baixa" && "😌"}
                        {intensity === "moderada" && "😅"}
                        {intensity === "alta" && "🥵"}
                        <span className="ml-1 capitalize">{intensity}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Momento</Label>
                  <div className="flex gap-2">
                    {[
                      { id: "antes_medicao", label: "Antes da Medição" },
                      { id: "durante_atividade", label: "Durante" },
                      { id: "apos_atividade", label: "Após Atividade" }
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setActivityMoment(m.id as any)}
                        className={`flex-1 py-2 text-[10px] sm:text-xs font-medium rounded-md border transition-all ${activityMoment === m.id
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background hover:bg-muted"
                          }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Passos (Opcional)</Label>
                  <div className="relative">
                    <Footprints className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="Ex: 5000"
                      className="pl-9"
                      value={steps}
                      onChange={(e) => setSteps(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>


          {/* Food Journal Section */}
          <div className="border rounded-xl p-4 bg-muted/20">
            <button
              type="button"
              onClick={() => setShowFood(!showFood)}
              className="flex items-center gap-2 w-full text-left font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Apple className="w-5 h-5" />
              <span>Registrar Alimentação?</span>
              <span className="ml-auto text-xs bg-muted px-2 py-1 rounded-full">{showFood ? "Sim" : "Não"}</span>
            </button>

            {showFood && (
              <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2">
                  <Label>Adicionar Alimentos</Label>
                  <FoodSearchCombobox
                    onSelect={(food) => {
                      setSelectedFoods([...selectedFoods, { ...food, portion: 100 }])
                    }}
                  />
                </div>

                {selectedFoods.length > 0 && (
                  <div className="space-y-2">
                    <Label>Alimentos Selecionados</Label>
                    <div className="space-y-2">
                      {selectedFoods.map((food, index) => (
                        <div key={index} className="flex items-center gap-2 bg-background p-2 rounded-md border text-sm">
                          <div className="flex-1">
                            <p className="font-medium">{food.nome}</p>
                            <p className="text-xs text-muted-foreground">
                              {Math.round((food.carboidratos_por_100g * food.portion) / 100)}g carbs
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={food.portion}
                              onChange={(e) => {
                                const newFoods = [...selectedFoods]
                                newFoods[index].portion = Number(e.target.value)
                                setSelectedFoods(newFoods)
                              }}
                              className="w-20 h-8 text-right"
                              min="0"
                            />
                            <span className="text-xs text-muted-foreground w-4">g</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive/90"
                            onClick={() => {
                              const newFoods = selectedFoods.filter((_, i) => i !== index)
                              setSelectedFoods(newFoods)
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="font-medium">Total de Carboidratos:</span>
                      <span className="font-bold text-primary">
                        {Math.round(selectedFoods.reduce((acc, curr) => acc + (curr.carboidratos_por_100g * curr.portion) / 100, 0))}g
                      </span>
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <Label className="text-xs text-muted-foreground">Ou insira carboidratos manualmente:</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="number"
                      placeholder="Ex: 45"
                      value={manualCarbs}
                      onChange={(e) => setManualCarbs(e.target.value)}
                      className="w-24 h-9"
                    />
                    <span className="text-sm">g</span>
                  </div>
                </div>

                {prediction && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 rounded-lg flex items-start gap-3 mt-1 animate-in slide-in-from-bottom-2">
                    <Sparkles className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Predição de Impacto</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        Estimativa de subida: <strong>{prediction.range[0]}-{prediction.range[1]} mg/dL</strong>
                        <span className="opacity-70 ml-1">(baseado em itens similares)</span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
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
              className="resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1 h-12 text-base">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 h-12 text-base bg-primary hover:bg-primary/90 font-semibold shadow-md">
              <Save className="w-5 h-5 mr-2" />
              {loading ? "Salvando..." : "Salvar Registro"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog >
  )
}
