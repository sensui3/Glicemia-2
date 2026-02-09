import { Utensils, Moon, Coffee, MoreHorizontal } from "lucide-react"
import { type GlucoseStatus } from "@/lib/types"

export function getConditionIcon(condition: string) {
    switch (condition) {
        case "jejum":
            return <Coffee className="w-5 h-5" />
        case "antes_refeicao":
            return <Utensils className="w-5 h-5" />
        case "apos_refeicao":
            return <Utensils className="w-5 h-5" />
        case "ao_dormir":
            return <Moon className="w-5 h-5" />
        default:
            return <MoreHorizontal className="w-5 h-5" />
    }
}

export function getConditionLabel(condition: string, time?: string) {
    switch (condition) {
        case "jejum":
            return "Jejum"
        case "antes_refeicao": {
            if (time) {
                const hour = Number.parseInt(time.split(":")[0])
                if (hour >= 5 && hour < 10) return "Antes do Café da Manhã"
                if (hour >= 10 && hour < 14) return "Antes do Almoço"
                if (hour >= 14 && hour < 19) return "Antes do Lanche"
                if (hour >= 19 || hour < 5) return "Antes do Jantar"
                return "Antes Ref."
            }
            return "Antes Ref."
        }
        case "apos_refeicao": {
            if (time) {
                const hour = Number.parseInt(time.split(":")[0])
                if (hour >= 5 && hour < 12) return "Após Café da Manhã"
                if (hour >= 12 && hour < 16) return "Após Almoço"
                if (hour >= 16 && hour < 19) return "Após Lanche"
                if (hour >= 19 || hour < 5) return "Após Jantar"
                return "Após Ref."
            }
            return "Após Ref."
        }
        case "ao_dormir":
            return "Ao Dormir"
        default:
            return "Outro"
    }
}

export function getStatusBadge(status: GlucoseStatus) {
    const styles = {
        normal: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        alto: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        baixo: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
        atencao: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    }

    const labels = {
        normal: "Normal",
        alto: "Alto",
        baixo: "Baixo",
        atencao: "Atenção",
    }

    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
            {labels[status]}
        </span>
    )
}

export const groupReadingsByDate = (readings: any[]) => {
    type DailyReadings = {
        date: string
        jejum?: any
        posCafe?: any
        preAlmoco?: any
        posAlmoco?: any
        preJantar?: any
        posJantar?: any
        madrugada?: any
    }

    const getSlot = (reading: any) => {
        const { condition, reading_time } = reading
        const hour = parseInt(reading_time.split(":")[0])
        if (condition === "jejum") return "jejum"
        if (condition === "ao_dormir") return "madrugada"
        if (condition === "antes_refeicao") {
            if (hour >= 5 && hour < 10) return "jejum"
            if (hour >= 10 && hour < 14) return "preAlmoco"
            if (hour >= 14 && hour < 23) return "preJantar"
        }
        if (condition === "apos_refeicao") {
            if (hour >= 5 && hour < 12) return "posCafe"
            if (hour >= 12 && hour < 16) return "posAlmoco"
            if (hour >= 16 && hour < 23) return "posJantar"
        }
        if (hour >= 0 && hour < 5) return "madrugada"
        return null
    }

    const grouped = readings.reduce((acc: any, reading: any) => {
        const date = reading.reading_date
        if (!acc[date]) acc[date] = { date }
        const slot = getSlot(reading)
        if (slot && !acc[date][slot]) acc[date][slot] = reading
        return acc
    }, {} as Record<string, DailyReadings>)

    return Object.values(grouped).sort((a: any, b: any) => b.date.localeCompare(a.date))
}
