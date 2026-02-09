"use client"

import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef, memo } from 'react'
import type { GlucoseReading, GlucoseLimits } from '@/lib/types'
import { getGlucoseStatus } from '@/lib/types'
import { getConditionIcon, getConditionLabel, getStatusBadge } from '@/lib/glucose-utils'
import { Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DeleteReadingButton } from "@/components/delete-reading-button"

const ROW_HEIGHT = 72 // Altura aproximada da linha com padding

const VirtualRow = memo(function VirtualRow({
    reading,
    style,
    onEdit,
    onDelete,
    limits
}: {
    reading: GlucoseReading
    style: React.CSSProperties
    onEdit: (r: GlucoseReading) => void
    onDelete: () => void
    limits?: GlucoseLimits
}) {
    const status = getGlucoseStatus(reading.reading_value, reading.condition, limits)
    const [year, month, day] = reading.reading_date.split("-")

    return (
        <div style={style} className="absolute top-0 left-0 w-full flex items-center border-b hover:bg-muted/50 transition-colors">
            {/* Data e Hora */}
            <div className="px-6 py-4 w-[140px] shrink-0">
                <div className="text-sm font-medium">{`${day}/${month}/${year}`}</div>
                <div className="text-sm text-muted-foreground">{reading.reading_time.slice(0, 5)}</div>
            </div>

            {/* Condição */}
            <div className="px-6 py-4 flex-1 min-w-[180px]">
                <div className="flex items-center gap-2">
                    {getConditionIcon(reading.condition)}
                    <span className="text-sm">
                        {getConditionLabel(reading.condition, reading.reading_time)}
                    </span>
                </div>
            </div>

            {/* Valor */}
            <div className="px-6 py-4 w-[120px] shrink-0">
                <div className="text-sm font-bold">{reading.reading_value} mg/dL</div>
            </div>

            {/* Status */}
            <div className="px-6 py-4 w-[120px] shrink-0">
                {getStatusBadge(status)}
            </div>

            {/* Observações */}
            <div className="px-6 py-4 flex-1 min-w-[150px]">
                <div className="text-sm text-muted-foreground truncate max-w-[200px]" title={reading.observations || ""}>
                    {reading.observations || "-"}
                </div>
            </div>

            {/* Ações */}
            <div className="px-6 py-4 w-[100px] shrink-0 text-right">
                <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(reading)}>
                        <Pencil className="w-4 h-4" />
                    </Button>
                    <DeleteReadingButton readingId={reading.id} onDataChange={onDelete} />
                </div>
            </div>
        </div>
    )
})

export function GlucoseTableVirtualized({
    readings,
    onEdit,
    onDelete,
    limits
}: {
    readings: GlucoseReading[]
    onEdit: (r: GlucoseReading) => void
    onDelete: () => void
    limits?: GlucoseLimits
}) {
    const parentRef = useRef<HTMLDivElement>(null)

    const virtualizer = useVirtualizer({
        count: readings.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => ROW_HEIGHT,
        overscan: 5
    })

    return (
        <div className="rounded-md border bg-card">
            {/* Header Falso para Alinhamento */}
            <div className="flex items-center border-b bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <div className="px-6 py-3 w-[140px] shrink-0">Data</div>
                <div className="px-6 py-3 flex-1 min-w-[180px]">Condição</div>
                <div className="px-6 py-3 w-[120px] shrink-0">Glicemia</div>
                <div className="px-6 py-3 w-[120px] shrink-0">Status</div>
                <div className="px-6 py-3 flex-1 min-w-[150px]">Observações</div>
                <div className="px-6 py-3 w-[100px] shrink-0 text-right">Ações</div>
            </div>

            {/* Container com Scroll Virtualizado */}
            <div ref={parentRef} className="h-[600px] overflow-auto relative">
                <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative', width: '100%' }}>
                    {virtualizer.getVirtualItems().map((virtualRow) => (
                        <VirtualRow
                            key={readings[virtualRow.index].id}
                            reading={readings[virtualRow.index]}
                            style={{
                                height: `${virtualRow.size}px`,
                                transform: `translateY(${virtualRow.start}px)`
                            }}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            limits={limits}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}
