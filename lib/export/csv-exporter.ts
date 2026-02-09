import { format } from "date-fns"
import { getConditionLabel, groupReadingsByDate } from "@/lib/glucose-utils"
import { getMedicationTypeLabel } from "@/lib/types"

export const exportAsCSV = (readings: any[], medications: any[], limits: any, startDate: Date, endDate: Date) => {
    const headers = ["Data", "Hora", "Condição", "Glicemia (mg/dL)", "Status", "Observações"]
    const rows = readings.map((r) => {
        const hypo = limits?.hypo_limit ?? 70
        const fastingMax = limits?.fasting_max ?? 99
        const postMealMax = limits?.post_meal_max ?? 140

        const status =
            r.reading_value < hypo ? "Baixo" : r.reading_value <= fastingMax ? "Normal" : r.reading_value <= postMealMax ? "Atenção" : "Alto"
        return [
            format(new Date(r.reading_date), "dd/MM/yyyy"),
            r.reading_time.slice(0, 5),
            getConditionLabel(r.condition),
            r.reading_value,
            status,
            r.observations || "",
        ]
    })

    let csvContent = "\uFEFF" + [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

    if (medications.length > 0) {
        csvContent += "\n\n"
        csvContent += '"MEDICAÇÕES DE USO CONTÍNUO"\n'
        csvContent += '"Nome","Tipo","Dosagem","Observações"\n'
        medications.forEach((med) => {
            const type = getMedicationTypeLabel(med.medication_type) || "Outro"
            const dosage = `${med.continuous_dosage || med.dosage} ${med.continuous_dosage_unit || med.dosage_unit}`
            const notes = med.notes || ""
            csvContent += `"${med.medication_name}","${type}","${dosage}","${notes}"\n`
        })
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `glicemia-${format(startDate, "yyyy-MM-dd")}-ate-${format(endDate, "yyyy-MM-dd")}.csv`
    link.click()
}

export const exportMedicalCSV = (readings: any[], medications: any[], startDate: Date, endDate: Date) => {
    const grouped = groupReadingsByDate(readings) as any[]
    const headers = ["Data", "Jejum", "2h Pós Café", "Antes Almoço", "2h Pós Almoço", "Antes Jantar", "2h Pós Jantar", "Madrugada"]

    const rows = grouped.map((day: any) => {
        return [
            format(new Date(day.date), "dd/MM/yyyy"),
            day.jejum?.reading_value || "-",
            day.posCafe?.reading_value || "-",
            day.preAlmoco?.reading_value || "-",
            day.posAlmoco?.reading_value || "-",
            day.preJantar?.reading_value || "-",
            day.posJantar?.reading_value || "-",
            day.madrugada?.reading_value || "-"
        ]
    })

    let csvContent = "\uFEFF" + [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

    if (medications && medications.length > 0) {
        csvContent += "\n\n"
        csvContent += '"MEDICAÇÕES DE USO CONTÍNUO"\n'
        csvContent += '"Nome","Tipo","Dosagem","Horário"\n'
        medications.forEach((med) => {
            const type = getMedicationTypeLabel(med.medication_type) || "Outro"
            const dosage = `${med.continuous_dosage || med.dosage} ${med.continuous_dosage_unit || med.dosage_unit}`
            csvContent += `"${med.medication_name}","${type}","${dosage}","${med.administration_time ? med.administration_time.slice(0, 5) : "-"}"\n`
        })
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `diario-glicemia-${format(startDate, "yyyy-MM-dd")}-ate-${format(endDate, "yyyy-MM-dd")}.csv`
    link.click()
}
