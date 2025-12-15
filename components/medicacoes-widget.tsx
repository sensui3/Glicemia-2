"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Pill, Settings } from "lucide-react"
import type { Medication } from "@/lib/types"
import { getMedicationTypeLabel } from "@/lib/types"
import { GerenciarMedicacoesModal } from "@/components/gerenciar-medicacoes-modal"

type Props = {
  userId: string
}

export function MedicacoesWidget({ userId }: Props) {
  const [medications, setMedications] = useState<Medication[]>([])
  const [loading, setLoading] = useState(true)
  const [isManaging, setIsManaging] = useState(false)

  useEffect(() => {
    void loadMedications()
  }, [userId])

  const loadMedications = async () => {
    setLoading(true)
    const supabase = createClient()

    const { data } = await supabase
      .from("medications")
      .select("*")
      .eq("user_id", userId)
      .eq("is_continuous", true)
      .eq("is_active", true)
      .eq("show_in_dashboard", true)
      .order("medication_name")

    setMedications((data as Medication[]) || [])
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="bg-card rounded-xl shadow-sm p-6 mb-6 border border-border">
        <div className="text-muted-foreground text-center">Carregando medicações...</div>
      </div>
    )
  }

  if (medications.length === 0) {
    return null
  }

  return (
    <>
      <div className="bg-card rounded-xl shadow-sm p-6 mb-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Pill className="w-5 h-5 text-amber-600" />
            <h3 className="text-lg font-semibold">Medicações de Uso Contínuo</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsManaging(true)}>
            <Settings className="w-4 h-4 mr-2" />
            Gerenciar
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {medications.map((med) => (
            <div key={med.id} className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold text-base">{med.medication_name}</h4>
                  <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 mt-1">
                    {getMedicationTypeLabel(med.medication_type)}
                  </span>
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Dosagem:</span>
                  <span className="font-semibold">
                    {med.continuous_dosage} {med.continuous_dosage_unit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Horário:</span>
                  <span className="font-semibold">{med.administration_time.slice(0, 5)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <GerenciarMedicacoesModal
        open={isManaging}
        onOpenChange={setIsManaging}
        userId={userId}
        onSuccess={loadMedications}
      />
    </>
  )
}
