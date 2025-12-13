export type GlucoseReading = {
  id: string
  user_id: string
  reading_value: number
  reading_date: string
  reading_time: string
  condition: "jejum" | "antes_refeicao" | "apos_refeicao" | "ao_dormir" | "outro"
  observations: string | null
  created_at: string
  updated_at: string
}

export type GlucoseStatus = "normal" | "alto" | "baixo" | "atencao"

export function getGlucoseStatus(value: number, condition: string): GlucoseStatus {
  // Valores de referência de jejum: 70-99 mg/dL (normal)
  if (condition === "jejum") {
    if (value < 70) return "baixo"
    if (value <= 99) return "normal"
    if (value <= 125) return "atencao"
    return "alto"
  }

  // Pós-refeição: até 140 mg/dL (normal)
  if (condition === "apos_refeicao") {
    if (value < 70) return "baixo"
    if (value <= 140) return "normal"
    if (value <= 180) return "atencao"
    return "alto"
  }

  // Padrão geral
  if (value < 70) return "baixo"
  if (value <= 140) return "normal"
  if (value <= 180) return "atencao"
  return "alto"
}

export type MedicationType = "insulina_rapida" | "insulina_lenta" | "insulina_intermediaria" | "insulina_basal" | "insulina_bolus" | "outro_medicamento"

export type Medication = {
  id: string
  user_id: string
  medication_name: string
  medication_type: MedicationType
  dosage: number
  dosage_unit: "UI" | "mg" | "ml" | "comprimido"
  administration_date: string
  administration_time: string
  notes: string | null
  is_continuous: boolean
  continuous_dosage: number | null
  continuous_dosage_unit: "UI" | "mg" | "ml" | "comprimido" | null
  is_active: boolean
  show_in_dashboard: boolean // Adicionando campo para controle de visibilidade
  created_at: string
  updated_at: string
}

export function getMedicationTypeLabel(type: MedicationType): string {
  const labels: Record<MedicationType, string> = {
    insulina_rapida: "Insulina Rápida",
    insulina_lenta: "Insulina Lenta",
    insulina_intermediaria: "Insulina Intermediária",
    insulina_basal: "Insulina Basal",
    insulina_bolus: "Insulina Bolus",
    outro_medicamento: "Outro Medicamento",
  }
  return labels[type]
}
