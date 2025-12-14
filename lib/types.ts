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

export type GlucoseLimits = {
  fasting_min: number
  fasting_max: number
  post_meal_max: number
  hypo_limit: number
  hyper_limit: number
}

export type UserProfile = {
  id: string
  user_id: string
  full_name: string | null
  glucose_limits: GlucoseLimits
  glucose_unit: "mg/dL" | "mmol/L"
  created_at: string
  updated_at: string
}

export type GlucoseStatus = "normal" | "alto" | "baixo" | "atencao"

export function getGlucoseStatus(value: number, condition: string, limits?: GlucoseLimits): GlucoseStatus {
  // Use limits if provided, otherwise default to standard values
  const fastingMin = limits?.fasting_min ?? 70
  const fastingMax = limits?.fasting_max ?? 99
  const postMealMax = limits?.post_meal_max ?? 140
  const hypoLimit = limits?.hypo_limit ?? 70
  const hyperLimit = limits?.hyper_limit ?? 180

  // Valores de referência de jejum
  if (condition === "jejum") {
    if (value < fastingMin) return "baixo"
    if (value <= fastingMax) return "normal"
    if (value <= 125) return "atencao" // This 125 might also need to be configurable or derived? Keeping hardcoded for now as it's pre-diabetes range usually constant
    return "alto"
  }

  // Pós-refeição
  if (condition === "apos_refeicao") {
    if (value < hypoLimit) return "baixo"
    if (value <= postMealMax) return "normal"
    if (value <= hyperLimit) return "atencao"
    return "alto"
  }

  // Padrão geral / outros momentos
  if (value < hypoLimit) return "baixo"
  if (value <= postMealMax) return "normal" // Using postMealMax as general upper normal limit
  if (value <= hyperLimit) return "atencao" // Using hyperLimit as start of 'alto'
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

export type Doctor = {
  id: string
  user_id: string
  name: string
  specialty: string
  address: string | null
  contact: string | null
  crm: string | null
  last_appointment: string | null
  next_appointment: string | null
  created_at: string
  updated_at: string
}

