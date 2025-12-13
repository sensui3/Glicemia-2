"use client"

import { type GlucoseReading } from "@/lib/types"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"

type Props = {
    readings: GlucoseReading[]
    sortOrder: "asc" | "desc"
}

/* ... */
type DailyReadings = {
    date: string
    jejum?: GlucoseReading
    posCafe?: GlucoseReading
    preAlmoco?: GlucoseReading
    posAlmoco?: GlucoseReading
    preJantar?: GlucoseReading
    posJantar?: GlucoseReading
    madrugada?: GlucoseReading
}

function getSlotForReading(reading: GlucoseReading): keyof DailyReadings | null {
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

function getStatusColor(value: number) {
    if (value < 70) return "bg-yellow-100 text-yellow-800 border-yellow-200"
    if (value <= 99) return "bg-green-100 text-green-800 border-green-200"
    if (value <= 140) return "bg-orange-100 text-orange-800 border-orange-200"
    return "bg-red-100 text-red-800 border-red-200"
}

export function GlucoseTableMedical({ readings, sortOrder }: Props) {
    /* ... */
    // Group readings by date
    const groupedReadings = readings.reduce((acc, reading) => {
        const date = reading.reading_date
        if (!acc[date]) {
            acc[date] = { date }
        }

        const slot = getSlotForReading(reading)
        // Verify slot is not 'date' (though getSlotForReading shouldn't return it) and is a valid reading key
        if (slot && slot !== 'date') {
            // Logic to handle multiple readings per slot could be improved
            // Currently keeps first encountered (which depends on input sort)
            // But usually we just want to ensure we fill the slot.
            if (!acc[date][slot]) {
                acc[date][slot] = reading
            }
        }
        return acc
    }, {} as Record<string, DailyReadings>)

    // Convert to array and sort by date based on sortOrder
    const rows = Object.values(groupedReadings).sort((a, b) => {
        if (sortOrder === "asc") {
            return a.date.localeCompare(b.date)
        } else {
            return b.date.localeCompare(a.date)
        }
    })

    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse">
                <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-100 min-w-[100px]">Data</th>
                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-100">Jejum</th>
                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-100">2h Pós Café</th>
                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-100">Antes Almoço</th>
                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-100">2h Pós Almoço</th>
                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-100">Antes Jantar</th>
                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-100">2h Pós Jantar</th>
                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Madrugada</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                    {rows.map((row) => {
                        const dateObj = parseISO(row.date)
                        const dayName = format(dateObj, "EEEE", { locale: ptBR })
                        const shortDayName = dayName.charAt(0).toUpperCase() + dayName.slice(1).split("-")[0]
                        const formattedDate = format(dateObj, "dd/MM/yyyy")

                        const renderCell = (reading?: GlucoseReading) => {
                            if (!reading) return <div className="text-gray-300">-</div>
                            return (
                                <div className={`px-2 py-1 rounded border text-sm font-semibold mx-auto w-fit ${getStatusColor(reading.reading_value)}`}>
                                    {reading.reading_value}
                                </div>
                            )
                        }

                        return (
                            <tr key={row.date} className="hover:bg-gray-50">
                                <td className="px-4 py-4 whitespace-nowrap border-r border-gray-100">
                                    <div className="text-sm font-bold text-gray-900">{formattedDate}</div>
                                    <div className="text-xs text-gray-500">{shortDayName}</div>
                                </td>
                                <td className="px-2 py-4 text-center border-r border-gray-100 space-y-1">{renderCell(row.jejum)}</td>
                                <td className="px-2 py-4 text-center border-r border-gray-100 space-y-1">{renderCell(row.posCafe)}</td>
                                <td className="px-2 py-4 text-center border-r border-gray-100 space-y-1">{renderCell(row.preAlmoco)}</td>
                                <td className="px-2 py-4 text-center border-r border-gray-100 space-y-1">{renderCell(row.posAlmoco)}</td>
                                <td className="px-2 py-4 text-center border-r border-gray-100 space-y-1">{renderCell(row.preJantar)}</td>
                                <td className="px-2 py-4 text-center border-r border-gray-100 space-y-1">{renderCell(row.posJantar)}</td>
                                <td className="px-2 py-4 text-center border-r border-gray-100 space-y-1">{renderCell(row.madrugada)}</td>
                            </tr>
                        )
                    })}
                    {rows.length === 0 && (
                        <tr>
                            <td colSpan={8} className="px-6 py-10 text-center text-gray-500">
                                Nenhum registro encontrado neste período.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    )
}
