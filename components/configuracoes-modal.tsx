"use client"

import { useState, useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Download, HelpCircle, RotateCcw, ExternalLink, Eye, Shield } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { AlterarSenhaModal } from "./alterar-senha-modal"
import { DataExportDialog } from "./data-export-dialog"
import { DeleteAccountDialog } from "./delete-account-dialog"
import { GlucoseLimits, GlucoseReading, MealTimes } from "@/lib/types"
import Link from "next/link"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DEFAULT_LIMITS: GlucoseLimits = {
  fasting_min: 70,
  fasting_max: 99,
  post_meal_max: 140,
  hypo_limit: 70,
  hyper_limit: 180
}

export function ConfiguracoesModal({ open, onOpenChange }: Props) {
  const queryClient = useQueryClient()
  const [email, setEmail] = useState("")
  const [fullName, setFullName] = useState("")
  const [glucoseUnit, setGlucoseUnit] = useState<"mg/dL" | "mmol/L">("mg/dL")
  const [limits, setLimits] = useState<GlucoseLimits>(DEFAULT_LIMITS)
  const [highContrast, setHighContrast] = useState(false)

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  const { toast } = useToast()

  // Estados para horários de refeições
  const [mealTimes, setMealTimes] = useState<MealTimes>({
    cafe_manha: "07:30",
    lanche_manha: "10:00",
    almoco: "12:00",
    lanche_tarde: "15:00",
    jantar: "18:00",
    lanche_noturno: "21:00"
  })
  const [advanceMinutes, setAdvanceMinutes] = useState<number>(45)

  useEffect(() => {
    if (open) {
      loadUserData()
      const isHighContrast = localStorage.getItem("high-contrast") === "true"
      setHighContrast(isHighContrast)
    }
  }, [open])

  useEffect(() => {
    if (highContrast) {
      document.documentElement.classList.add("high-contrast")
      localStorage.setItem("high-contrast", "true")
    } else {
      document.documentElement.classList.remove("high-contrast")
      localStorage.setItem("high-contrast", "false")
    }
  }, [highContrast])

  const loadUserData = async () => {
    setIsLoading(true)
    const supabase = createClient()

    // Get Auth User
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      setEmail(user.email || "")

      // Get Profile Data
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (profile) {
        setFullName(profile.full_name || "")
        if (profile.glucose_limits) {
          setLimits(profile.glucose_limits as GlucoseLimits)
        }
        if (profile.glucose_unit) {
          setGlucoseUnit(profile.glucose_unit)
        }
        if (profile.meal_times) {
          setMealTimes(profile.meal_times as MealTimes)
        }
        if (profile.meal_advance_minutes !== null && profile.meal_advance_minutes !== undefined) {
          setAdvanceMinutes(profile.meal_advance_minutes)
        }
      }
    }
    setIsLoading(false)
  }

  const handleSave = async () => {
    setIsSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setIsSaving(false)
      return
    }

    const { error } = await supabase
      .from('profiles')
      .upsert({
        user_id: user.id,
        full_name: fullName,
        glucose_limits: limits,
        glucose_unit: glucoseUnit,
        meal_times: mealTimes,
        meal_advance_minutes: advanceMinutes,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })

    if (error) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive"
      })
    } else {
      toast({
        title: "Configurações salvas",
        description: "Suas preferências foram atualizadas com sucesso."
      })
      queryClient.invalidateQueries({ queryKey: ["user-profile"] })
      onOpenChange(false)
    }
    setIsSaving(false)
  }

  const handleRestoreDefaults = () => {
    setLimits(DEFAULT_LIMITS)
    toast({
      title: "Valores restaurados",
      description: "Os valores de referência voltaram ao padrão do sistema."
    })
  }

  const handleExportData = async () => {
    setIsExporting(true)
    try {
      const supabase = createClient()
      const { data: readings, error } = await supabase
        .from('glucose_readings')
        .select('*')
        .order('reading_date', { ascending: false })
        .order('reading_time', { ascending: false })

      if (error) throw error

      if (!readings || readings.length === 0) {
        toast({
          title: "Sem dados",
          description: "Não há registros para exportar.",
          variant: "destructive"
        })
        return
      }

      // Create CSV content
      const headers = ["Data", "Hora", "Valor", "Unidade", "Momento", "Observações"]
      const csvContent = [
        headers.join(","),
        ...readings.map((r: GlucoseReading) => [
          r.reading_date,
          r.reading_time,
          r.reading_value,
          "mg/dL", // Currently assuming stored as mg/dL
          r.condition,
          `"${(r.observations || "").replace(/"/g, '""')}"`
        ].join(","))
      ].join("\n")

      // Create and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `glicemia_export_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

    } catch (error: any) {
      toast({
        title: "Erro na exportação",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Configurações</DialogTitle>
            <DialogDescription>Gerencie perfil, metas e dados do sistema</DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-8 py-4">

              {/* Seção 1: Conta e Perfil */}
              <section className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="font-semibold text-lg text-foreground">Conta e Perfil</h3>
                </div>

                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={email} disabled className="bg-muted text-muted-foreground" />
                    <p className="text-[11px] text-muted-foreground">O e-mail não pode ser alterado no momento.</p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="fullname">Nome Completo</Label>
                    <Input
                      id="fullname"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Seu nome"
                    />
                  </div>

                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPasswordModal(true)}
                    >
                      Alterar Senha
                    </Button>
                  </div>
                </div>
              </section>

              {/* Seção 2: Valores de Referência e Metas */}
              <section className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="font-semibold text-lg text-foreground">Valores de Referência e Metas</h3>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="fasting_min">Jejum (Mínimo)</Label>
                    <div className="relative">
                      <Input
                        id="fasting_min"
                        type="number"
                        value={limits.fasting_min}
                        onChange={(e) => setLimits({ ...limits, fasting_min: Number(e.target.value) })}
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">mg/dL</span>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="fasting_max">Jejum (Máximo)</Label>
                    <div className="relative">
                      <Input
                        id="fasting_max"
                        type="number"
                        value={limits.fasting_max}
                        onChange={(e) => setLimits({ ...limits, fasting_max: Number(e.target.value) })}
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">mg/dL</span>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="post_meal">Pós-refeição (Máximo)</Label>
                    <div className="relative">
                      <Input
                        id="post_meal"
                        type="number"
                        value={limits.post_meal_max}
                        onChange={(e) => setLimits({ ...limits, post_meal_max: Number(e.target.value) })}
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">mg/dL</span>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="hypo">Hipoglicemia (Inferior)</Label>
                    <div className="relative">
                      <Input
                        id="hypo"
                        type="number"
                        value={limits.hypo_limit}
                        onChange={(e) => setLimits({ ...limits, hypo_limit: Number(e.target.value) })}
                        className="border-red-200 dark:border-red-900 focus:border-red-400 focus:ring-red-400"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">mg/dL</span>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="hyper">Hiperglicemia (Superior)</Label>
                    <div className="relative">
                      <Input
                        id="hyper"
                        type="number"
                        value={limits.hyper_limit}
                        onChange={(e) => setLimits({ ...limits, hyper_limit: Number(e.target.value) })}
                        className="border-orange-200 dark:border-orange-900 focus:border-orange-400 focus:ring-orange-400"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">mg/dL</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRestoreDefaults}
                    className="text-muted-foreground hover:text-foreground h-8 px-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-2" />
                    Restaurar Valores Padrão
                  </Button>
                </div>
              </section>

              {/* Seção 2.5: Horários de Refeições */}
              <section className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="font-semibold text-lg text-foreground">Horários de Refeições</h3>
                </div>

                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Configure seus horários padrão de refeições. O sistema irá sugerir automaticamente a refeição quando você estiver dentro do período de antecedência.
                  </p>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="cafe_manha">Café da Manhã</Label>
                      <Input
                        id="cafe_manha"
                        type="time"
                        value={mealTimes.cafe_manha}
                        onChange={(e) => setMealTimes({ ...mealTimes, cafe_manha: e.target.value })}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="lanche_manha">Lanche da Manhã</Label>
                      <Input
                        id="lanche_manha"
                        type="time"
                        value={mealTimes.lanche_manha}
                        onChange={(e) => setMealTimes({ ...mealTimes, lanche_manha: e.target.value })}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="almoco">Almoço</Label>
                      <Input
                        id="almoco"
                        type="time"
                        value={mealTimes.almoco}
                        onChange={(e) => setMealTimes({ ...mealTimes, almoco: e.target.value })}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="lanche_tarde">Lanche da Tarde</Label>
                      <Input
                        id="lanche_tarde"
                        type="time"
                        value={mealTimes.lanche_tarde}
                        onChange={(e) => setMealTimes({ ...mealTimes, lanche_tarde: e.target.value })}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="jantar">Jantar</Label>
                      <Input
                        id="jantar"
                        type="time"
                        value={mealTimes.jantar}
                        onChange={(e) => setMealTimes({ ...mealTimes, jantar: e.target.value })}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="lanche_noturno">Lanche Noturno</Label>
                      <Input
                        id="lanche_noturno"
                        type="time"
                        value={mealTimes.lanche_noturno}
                        onChange={(e) => setMealTimes({ ...mealTimes, lanche_noturno: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid gap-2 pt-2">
                    <Label htmlFor="advance_minutes">Tempo de Antecedência (minutos)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="advance_minutes"
                        type="number"
                        min="15"
                        max="120"
                        step="5"
                        value={advanceMinutes}
                        onChange={(e) => setAdvanceMinutes(Number(e.target.value))}
                        className="w-32"
                      />
                      <span className="text-sm text-muted-foreground">
                        minutos antes da refeição
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      O sistema irá sugerir "Antes Refeição" quando você registrar glicemia dentro deste período antes do horário da refeição.
                    </p>
                  </div>
                </div>
              </section>

              {/* Seção 3: Configurações do Sistema e Dados */}
              <section className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="font-semibold text-lg text-foreground">Configurações do Sistema e Dados</h3>
                </div>

                <div className="grid gap-6">
                  <div className="grid gap-2">
                    <Label>Unidade de Glicemia</Label>
                    <Select
                      value={glucoseUnit}
                      onValueChange={(val: "mg/dL" | "mmol/L") => setGlucoseUnit(val)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mg/dL">mg/dL</SelectItem>
                        <SelectItem value="mmol/L">mmol/L</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label>Exportação de Dados</Label>
                    <div>
                      <Button onClick={handleExportData} disabled={isExporting} className="w-full sm:w-auto">
                        {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                        Exportar Relatório (.CSV)
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <Label>Sobre o App</Label>
                    <div className="bg-muted rounded-lg p-3 text-sm text-foreground flex justify-between items-center">
                      <span>Versão 1.0.0</span>
                      <a
                        href="#"
                        className="flex items-center text-primary hover:underline"
                        onClick={(e) => {
                          e.preventDefault()
                          toast({ description: "FAQ indisponível no momento." }) // Placeholder
                        }}
                      >
                        <HelpCircle className="w-3.5 h-3.5 mr-1.5" />
                        Ajuda e Suporte
                      </a>
                    </div>
                  </div>
                </div>
              </section>

              {/* Seção 4: Privacidade e LGPD */}
              <section className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-lg text-foreground">Privacidade e Dados (LGPD)</h3>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="space-y-3">
                    <Label>Documentos Legais</Label>
                    <div className="flex flex-col gap-2">
                      <Link href="/terms" target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" className="w-full justify-start gap-2">
                          <ExternalLink className="w-4 h-4" />
                          Termos de Uso
                        </Button>
                      </Link>
                      <Link href="/privacy" target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" className="w-full justify-start gap-2">
                          <ExternalLink className="w-4 h-4" />
                          Política de Privacidade
                        </Button>
                      </Link>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Seus Direitos (LGPD Art. 18)</Label>
                    <div className="flex flex-col gap-2">
                      <DataExportDialog />
                      <DeleteAccountDialog />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Você tem direito à portabilidade e ao esquecimento dos seus dados conforme a Lei Geral de Proteção de Dados.
                    </p>
                  </div>
                </div>
              </section>

              {/* Seção 5: Acessibilidade */}
              <section className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-muted-foreground" />
                    <h3 className="font-semibold text-lg text-foreground">Acessibilidade</h3>
                  </div>
                </div>

                <div className="grid gap-6">
                  <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-0.5">
                      <Label htmlFor="high-contrast">Modo de Alto Contraste</Label>
                      <p className="text-sm text-muted-foreground">
                        Aumenta o contraste das cores para melhorar a legibilidade.
                      </p>
                    </div>
                    <Switch
                      id="high-contrast"
                      checked={highContrast}
                      onCheckedChange={setHighContrast}
                      aria-label="Ativar modo de alto contraste"
                    />
                  </div>
                </div>
              </section>

            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 border-t pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving || isLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlterarSenhaModal open={showPasswordModal} onOpenChange={setShowPasswordModal} />
    </>
  )
}
