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
