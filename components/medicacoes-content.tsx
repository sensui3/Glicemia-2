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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Medicações</h1>
          <p className="text-muted-foreground">Gerencie suas insulinas e outros medicamentos.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Nova Medicação
        </Button>
      </div>

      {continuousMeds.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-amber-600" />
            <h2 className="text-xl font-semibold">Medicações de Uso Contínuo</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {continuousMeds.map((med) => (
              <div
                key={med.id}
                className={`bg-card rounded-lg border-2 p-4 transition-all ${med.is_active ? "border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900" : "border-border bg-muted opacity-60"
                  }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{med.medication_name}</h3>
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
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dosagem Padrão:</span>
                    <span className="font-semibold">
                      {med.continuous_dosage} {med.continuous_dosage_unit}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Horário Habitual:</span>
                    <span className="font-semibold">{med.administration_time.slice(0, 5)}</span>
                  </div>
                  {med.notes && (
                    <div className="pt-2 border-t">
                      <p className="text-muted-foreground text-xs">{med.notes}</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleToggleActive(med)} className="flex-1">
                    {med.is_active ? "Pausar" : "Reativar"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setEditingMed(med)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(med.id)}>
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Medications List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Histórico de Medicações</h2>
        <div className="bg-card rounded-xl shadow-sm border border-border">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando...</div>
          ) : medications.length === 0 && continuousMeds.length === 0 ? (
            <div className="p-12 text-center">
              <div className="bg-muted rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Pill className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Nenhuma medicação registrada</h3>
              <p className="text-muted-foreground mb-4">Comece adicionando suas insulinas e medicamentos.</p>
              <Button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Primeira Medicação
              </Button>
            </div>
          ) : medications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">Nenhuma medicação pontual registrada ainda.</div>
          ) : (
            <div className="divide-y divide-border">
              {medications.map((med) => (
                <div key={med.id} className="p-6 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{med.medication_name}</h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                          {getMedicationTypeLabel(med.medication_type)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium">Data:</span>{" "}
                          {format(new Date(med.administration_date), "dd/MM/yyyy")}
                        </div>
                        <div>
                          <span className="font-medium">Hora:</span> {med.administration_time.slice(0, 5)}
                        </div>
                        <div>
                          <span className="font-medium">Dosagem:</span> {med.dosage} {med.dosage_unit}
                        </div>
                        {med.notes && (
                          <div className="col-span-2 md:col-span-4">
                            <span className="font-medium">Obs:</span> {med.notes}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button variant="ghost" size="icon" onClick={() => setEditingMed(med)}>
                        <Edit className="w-4 h-4 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(med.id)}>
                        <Trash2 className="w-4 h-4 text-red-600" />
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
