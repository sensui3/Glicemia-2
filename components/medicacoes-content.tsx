"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Plus, Pill, Trash2, Edit, CheckCircle, XCircle, Clock } from "lucide-react"
import { NovaMedicacaoModal } from "@/components/nova-medicacao-modal"
import { EditarMedicacaoModal } from "@/components/editar-medicacao-modal"
import { format } from "date-fns"
import type { Medication } from "@/lib/types"
import { getMedicationTypeLabel } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

type Props = {
  userId: string
}

export function MedicacoesContent({ userId }: Props) {
  const [medications, setMedications] = useState<Medication[]>([])
  const [continuousMeds, setContinuousMeds] = useState<Medication[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMed, setEditingMed] = useState<Medication | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadMedications()
  }, [userId])

  const loadMedications = async () => {
    setLoading(true)
    const supabase = createClient()

    const { data: continuousData } = await supabase
      .from("medications")
      .select("*")
      .eq("user_id", userId)
      .eq("is_continuous", true)
      .eq("is_active", true)
      .order("medication_name")

    const { data: regularData } = await supabase
      .from("medications")
      .select("*")
      .eq("user_id", userId)
      .or("is_continuous.eq.false,is_active.eq.false")
      .order("administration_date", { ascending: false })
      .order("administration_time", { ascending: false })

    setContinuousMeds((continuousData as Medication[]) || [])
    setMedications((regularData as Medication[]) || [])
    setLoading(false)
  }

  const handleToggleActive = async (med: Medication) => {
    const supabase = createClient()
    const { error } = await supabase.from("medications").update({ is_active: !med.is_active }).eq("id", med.id)

    if (error) {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o status da medicação.",
        variant: "destructive",
      })
    } else {
      toast({
        title: med.is_active ? "Medicação pausada" : "Medicação reativada",
        description: med.is_active
          ? "A medicação de uso contínuo foi pausada."
          : "A medicação de uso contínuo foi reativada.",
      })
      loadMedications()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar esta medicação?")) return

    const supabase = createClient()
    const { error } = await supabase.from("medications").delete().eq("id", id)

    if (error) {
      toast({
        title: "Erro ao deletar",
        description: "Não foi possível deletar a medicação.",
        variant: "destructive",
      })
    } else {
      toast({
        title: "Medicação deletada!",
        description: "A medicação foi removida com sucesso.",
      })
      loadMedications()
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Medicações</h1>
          <p className="text-muted-foreground">Gerencie suas insulinas e outros medicamentos.</p>
        </div>
      </div>

      {/* Main Action */}
      <div className="flex flex-col md:flex-row gap-4">
        <Button
          onClick={() => setIsModalOpen(true)}
          className="h-24 text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98] w-full md:w-auto md:min-w-[350px]"
        >
          <Plus className="w-8 h-8 mr-3" />
          NOVA MEDICAÇÃO
        </Button>
      </div>

      {continuousMeds.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" />
            <h2 className="text-xl font-semibold">Medicações de Uso Contínuo</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {continuousMeds.map((med) => (
              <div
                key={med.id}
                className={`bg-card rounded-xl border shadow-sm p-6 transition-all relative overflow-hidden group hover:shadow-md ${med.is_active ? "border-amber-200/50 dark:border-amber-900/50" : "opacity-60"
                  }`}
              >
                {/* Decorative background element for active cards */}
                {med.is_active && (
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 dark:bg-amber-900/10 rounded-bl-full -mr-4 -mt-4 -z-0 pointer-events-none transition-colors" />
                )}

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="font-bold text-lg leading-tight">{med.medication_name}</h3>
                        {med.is_active ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        {getMedicationTypeLabel(med.medication_type)}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2.5 text-sm mb-5 text-muted-foreground">
                    <div className="flex justify-between items-center bg-muted/30 p-2 rounded-md">
                      <span>Dosagem</span>
                      <span className="font-semibold text-foreground">
                        {med.continuous_dosage} {med.continuous_dosage_unit}
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-muted/30 p-2 rounded-md">
                      <span>Horário</span>
                      <span className="font-semibold text-foreground">{med.administration_time.slice(0, 5)}</span>
                    </div>
                    {med.notes && (
                      <div className="pt-2">
                        <p className="text-xs italic line-clamp-2">{med.notes}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleToggleActive(med)} className="flex-1 hover:bg-muted">
                      {med.is_active ? "Pausar" : "Reativar"}
                    </Button>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-blue-600" onClick={() => setEditingMed(med)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600" onClick={() => handleDelete(med.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Medications List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Histórico de Medicações</h2>
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando...</div>
          ) : medications.length === 0 && continuousMeds.length === 0 ? (
            <div className="p-16 text-center">
              <div className="bg-muted rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 border shadow-sm">
                <Pill className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Nenhuma medicação registrada</h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">Comece adicionando suas insulinas e medicamentos para manter seu histórico organizado.</p>
              <Button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 shadow-sm">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Primeira Medicação
              </Button>
            </div>
          ) : medications.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground bg-muted/10">Nenhuma medicação pontual registrada ainda.</div>
          ) : (
            <div className="divide-y divide-border">
              {medications.map((med) => (
                <div key={med.id} className="p-4 sm:p-6 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-foreground">{med.medication_name}</h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                          {getMedicationTypeLabel(med.medication_type)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-2 text-sm text-muted-foreground">
                        <div className="flex flex-col">
                          <span className="text-xs uppercase tracking-wider font-medium text-muted-foreground/70">Data</span>
                          <span className="font-medium text-foreground">{format(new Date(med.administration_date), "dd/MM/yyyy")}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs uppercase tracking-wider font-medium text-muted-foreground/70">Hora</span>
                          <span className="font-medium text-foreground">{med.administration_time.slice(0, 5)}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs uppercase tracking-wider font-medium text-muted-foreground/70">Dosagem</span>
                          <span className="font-medium text-foreground">{med.dosage} {med.dosage_unit}</span>
                        </div>
                        {med.notes && (
                          <div className="col-span-2 md:col-span-1 flex flex-col">
                            <span className="text-xs uppercase tracking-wider font-medium text-muted-foreground/70">Obs</span>
                            <span className="truncate" title={med.notes}>{med.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 ml-4 self-center">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-blue-600" onClick={() => setEditingMed(med)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600" onClick={() => handleDelete(med.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <NovaMedicacaoModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        userId={userId}
        onSuccess={loadMedications}
      />

      {editingMed && (
        <EditarMedicacaoModal
          open={!!editingMed}
          onOpenChange={(open) => !open && setEditingMed(null)}
          medication={editingMed}
          onSuccess={loadMedications}
        />
      )}
    </div>
  )
}
