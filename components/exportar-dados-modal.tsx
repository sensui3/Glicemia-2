"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Download, FileText, Sheet } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { useUserProfile } from "@/hooks/use-user-profile"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  sortOrder?: "asc" | "desc"
}

export function ExportarDadosModal({ open, onOpenChange, userId, sortOrder = "desc" }: Props) {
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [formatType, setFormatType] = useState<"pdf" | "csv">("pdf")
  const [exportModel, setExportModel] = useState<"standard" | "medical">("standard")
  const [isExporting, setIsExporting] = useState(false)
  const [includeMedications, setIncludeMedications] = useState(true)
  const { toast } = useToast()

  const { data: userProfile } = useUserProfile(userId)
  const limits = userProfile?.glucose_limits

  const handleExport = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Erro",
        description: "Por favor, selecione o período completo",
        variant: "destructive",
      })
      return
    }

    setIsExporting(true)

    try {
      const supabase = createClient()

      // Buscar leituras para o relatório
      const { data: readings, error } = await supabase
        .from("glucose_readings")
        .select("*")
        .eq("user_id", userId)
        .gte("reading_date", format(startDate, "yyyy-MM-dd"))
        .lte("reading_date", format(endDate, "yyyy-MM-dd"))
        .order("reading_date", { ascending: sortOrder === "asc" })
        .order("reading_time", { ascending: sortOrder === "asc" })

      if (error) throw error

      // Buscar leituras para HbA1c (últimos 90 dias a partir da data final)
      const hba1cStartDate = new Date(endDate)
      hba1cStartDate.setDate(hba1cStartDate.getDate() - 90)

      const { data: hba1cReadings } = await supabase
        .from("glucose_readings")
        .select("reading_value")
        .eq("user_id", userId)
        .gte("reading_date", format(hba1cStartDate, "yyyy-MM-dd"))
        .lte("reading_date", format(endDate, "yyyy-MM-dd"))

      let hba1cAvg = 0
      if (hba1cReadings && hba1cReadings.length > 0) {
        const sum = hba1cReadings.reduce((acc: number, curr: any) => acc + (Number(curr.reading_value) || 0), 0)
        hba1cAvg = sum / hba1cReadings.length
      }
      const hba1cValue = hba1cAvg > 0 ? ((hba1cAvg + 46.7) / 28.7).toFixed(1) : "-"

      let medications: any[] = []
      if (includeMedications) {
        const { data: medsData, error: medsError } = await supabase
          .from("medications")
          .select("*")
          .eq("user_id", userId)
          .eq("is_continuous", true)
          .eq("is_active", true)
          .order("medication_name", { ascending: true })

        if (!medsError) {
          medications = medsData || []
        }
      }

      if (formatType === "csv") {
        if (exportModel === "medical") {
          const { exportMedicalCSV } = await import("@/lib/export/csv-exporter")
          exportMedicalCSV(readings || [], medications, startDate!, endDate!)
        } else {
          const { exportAsCSV } = await import("@/lib/export/csv-exporter")
          exportAsCSV(readings || [], medications, limits, startDate!, endDate!)
        }
      } else {
        if (exportModel === "medical") {
          const { exportMedicalPDF } = await import("@/lib/export/pdf-exporter")
          await exportMedicalPDF(readings || [], medications, limits, startDate!, endDate!, hba1cValue)
        } else {
          const { exportAsPDF } = await import("@/lib/export/pdf-exporter")
          await exportAsPDF(readings || [], medications, limits, startDate!, endDate!)
        }
      }

      toast({
        title: "Exportação concluída!",
        description: `Dados exportados com sucesso em formato ${formatType.toUpperCase()}`,
      })

      onOpenChange(false)
    } catch (error) {
      console.error("Erro ao exportar:", error)
      toast({
        title: "Erro ao exportar",
        description: "Não foi possível exportar os dados. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const quickPeriods = [
    { label: "Últimos 7 dias", days: 7 },
    { label: "Últimos 30 dias", days: 30 },
    { label: "Este mês", days: new Date().getDate() },
    { label: "Últimos 3 meses", days: 90 },
  ]

  const handleQuickPeriod = (days: number) => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)
    setStartDate(start)
    setEndDate(end)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Exportar Dados de Glicemia</DialogTitle>
          <DialogDescription>Selecione o período e o formato para baixar seu histórico.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Período Rápido */}
          <div>
            <label className="text-sm font-medium mb-2 block">Período Rápido</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {quickPeriods.map((period) => (
                <Button
                  key={period.label}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickPeriod(period.days)}
                  className="justify-start text-xs md:text-sm"
                >
                  {period.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Seleção de Datas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Início</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate} />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Fim</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={endDate} onSelect={setEndDate} />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Resumo do Período */}
          {startDate && endDate && (
            <div className="bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 md:p-4">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">Resumo da Exportação</p>
              <p className="text-xs md:text-sm text-blue-700 dark:text-blue-400">
                Período Selecionado: <strong>{format(startDate, "dd 'de' MMMM", { locale: ptBR })}</strong> -{" "}
                <strong>{format(endDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</strong>
                <span className="block mt-1">
                  ({Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} dias)
                </span>
              </p>
            </div>
          )}

          <div className="flex items-center space-x-2 p-3 bg-teal-50/50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-lg">
            <Checkbox
              id="include-medications"
              checked={includeMedications}
              onCheckedChange={(checked) => setIncludeMedications(checked as boolean)}
            />
            <label
              htmlFor="include-medications"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Incluir medicações de uso contínuo na exportação
            </label>
          </div>

          {/* Modelo da Tabela */}
          <div>
            <label className="text-sm font-medium mb-3 block">Modelo da Tabela</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setExportModel("standard")}
                className={cn(
                  "flex flex-col items-center justify-center p-3 md:p-4 border-2 rounded-lg transition-all",
                  exportModel === "standard"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50 bg-card hover:bg-muted/50",
                )}
              >
                <div className="flex flex-col gap-1 items-center">
                  <div className="flex gap-1">
                    <div className="w-6 h-1 bg-current rounded-full" />
                  </div>
                  <div className="flex gap-1">
                    <div className="w-6 h-1 bg-current rounded-full" />
                  </div>
                  <div className="flex gap-1">
                    <div className="w-6 h-1 bg-current rounded-full" />
                  </div>
                </div>
                <span className="font-medium text-xs md:text-sm mt-2">Modelo Padrão</span>
                <span className="text-[10px] md:text-xs text-muted-foreground mt-1">Lista detalhada</span>
              </button>

              <button
                onClick={() => setExportModel("medical")}
                className={cn(
                  "flex flex-col items-center justify-center p-3 md:p-4 border-2 rounded-lg transition-all",
                  exportModel === "medical"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50 bg-card hover:bg-muted/50",
                )}
              >
                <div className="grid grid-cols-2 gap-1 w-6">
                  <div className="h-2 w-full bg-current rounded-sm"></div>
                  <div className="h-2 w-full bg-current rounded-sm"></div>
                  <div className="h-2 w-full bg-current rounded-sm"></div>
                  <div className="h-2 w-full bg-current rounded-sm"></div>
                </div>
                <span className="font-medium text-xs md:text-sm mt-2">Modelo Médico</span>
                <span className="text-[10px] md:text-xs text-muted-foreground mt-1">Visão diária</span>
              </button>
            </div>
          </div>

          {/* Formato do Arquivo */}
          <div>
            <label className="text-sm font-medium mb-3 block">Formato do Arquivo</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setFormatType("pdf")}
                className={cn(
                  "flex flex-col items-center justify-center p-3 md:p-4 border-2 rounded-lg transition-all",
                  formatType === "pdf"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50 bg-card hover:bg-muted/50",
                )}
              >
                <FileText
                  className={cn("w-6 h-6 md:w-8 md:h-8 mb-2", formatType === "pdf" ? "text-primary" : "text-muted-foreground")}
                />
                <span className="font-medium text-xs md:text-sm">PDF (Relatório)</span>
                <span className="text-[10px] md:text-xs text-muted-foreground mt-1">Com gráfico incluso</span>
              </button>

              <button
                onClick={() => setFormatType("csv")}
                className={cn(
                  "flex flex-col items-center justify-center p-3 md:p-4 border-2 rounded-lg transition-all",
                  formatType === "csv"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50 bg-card hover:bg-muted/50",
                )}
              >
                <Sheet
                  className={cn("w-6 h-6 md:w-8 md:h-8 mb-2", formatType === "csv" ? "text-primary" : "text-muted-foreground")}
                />
                <span className="font-medium text-xs md:text-sm">CSV (Excel)</span>
                <span className="text-[10px] md:text-xs text-muted-foreground mt-1">Dados brutos</span>
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleExport}
            disabled={!startDate || !endDate || isExporting}
            className="bg-teal-600 hover:bg-teal-700 w-full sm:w-auto"
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? "Exportando..." : "Exportar Arquivo"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
