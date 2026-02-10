"use client"

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

export type Hba1cPoint = {
    date: string
    value: number
    formattedDate: string
}

type Props = {
    data: Hba1cPoint[]
    onLoadDetailed?: () => void
}

export function Hba1cChart({ data, onLoadDetailed }: Props) {
    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
                <p>Dados simplificados para otimização.</p>
                {onLoadDetailed && (
                    <button
                        onClick={onLoadDetailed}
                        className="text-sm underline text-primary hover:text-primary/80"
                    >
                        Carregar histórico detalhado
                    </button>
                )}
            </div>
        )
    }

    return (
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200} debounce={200}>
            <AreaChart data={data}>
                <defs>
                    <linearGradient id="colorA1c" x1="0" y1="0" x2="0" y2="1">
                        <stop key="gradient-start" offset="5%" stopColor="#9333ea" stopOpacity={0.3} />
                        <stop key="gradient-end" offset="95%" stopColor="#9333ea" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                    dataKey="formattedDate"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    stroke="hsl(var(--muted-foreground))"
                />
                <YAxis
                    domain={['dataMin - 0.5', 'dataMax + 0.5']}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}%`}
                    stroke="hsl(var(--muted-foreground))"
                />
                <Tooltip
                    contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid hsl(var(--border))',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        backgroundColor: 'hsl(var(--popover))',
                        color: 'hsl(var(--popover-foreground))'
                    }}
                    formatter={(value: number) => [`${value}%`, "HbA1c"]}
                    labelFormatter={(label) => `Semana de ${label}`}
                    cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeOpacity: 0.2 }}
                />
                <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#9333ea"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorA1c)"
                />
            </AreaChart>
        </ResponsiveContainer>
    )
}
