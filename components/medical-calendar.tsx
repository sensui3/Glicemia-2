"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Calendar } from "@/components/ui/calendar"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, Calendar as CalendarIcon, Clock, MapPin } from "lucide-react"
import { ptBR } from "date-fns/locale"
import { format } from "date-fns"

type MedicalEvent = {
    id: string
    title: string
    date: string
    time: string
    type: "consulta" | "exame" | "vacina" | "outro"
}

type Props = {
    userId: string
}

export function MedicalCalendar({ userId }: Props) {
    const { toast } = useToast()
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [events, setEvents] = useState<MedicalEvent[]>([])
    const [newEventTitle, setNewEventTitle] = useState("")
    const [newEventTime, setNewEventTime] = useState("")
    const [newEventType, setNewEventType] = useState<"consulta" | "exame" | "vacina" | "outro">("consulta")

    useEffect(() => {
        loadEvents()
    }, [userId])

    const loadEvents = async () => {
        // First try to load from local storage for instant feedback
        const storedEvents = localStorage.getItem(`medical_events_${userId}`)
        if (storedEvents) {
            setEvents(JSON.parse(storedEvents))
        }

        // Then try to load from Supabase Storage (cloud)
        try {
            const supabase = createClient()

            // Verifique se o arquivo existe antes de tentar baixar para evitar erro 400
            const { data: listData, error: listError } = await supabase.storage
                .from('user_data')
                .list(userId, {
                    limit: 1,
                    search: 'medical_events.json'
                })

            if (listError) {
                // Silently ignore list errors usually meaning no bucket or permission yet
                return
            }

            if (!listData || listData.length === 0) {
                // File doesn't exist yet, just stop here without error
                return
            }

            const { data, error } = await supabase.storage
                .from('user_data')
                .download(`${userId}/medical_events.json`)

            if (error) {
                console.log("Error downloading remote events:", error.message)
                return
            }

            if (data) {
                const text = await data.text()
                const remoteEvents = JSON.parse(text)
                setEvents(remoteEvents)
                // Update local storage to match remote
                localStorage.setItem(`medical_events_${userId}`, text)
            }
        } catch (err) {
            console.error("Error loading remote events:", err)
        }
    }

    const saveEventsToStorage = async (updatedEvents: MedicalEvent[]) => {
        // 1. Save locally immediately
        const jsonString = JSON.stringify(updatedEvents)
        localStorage.setItem(`medical_events_${userId}`, jsonString)
        setEvents(updatedEvents)

        // 2. Save to Supabase Storage (Cloud)
        try {
            const supabase = createClient()
            const blob = new Blob([jsonString], { type: 'application/json' })

            const { error } = await supabase.storage
                .from('user_data')
                .upload(`${userId}/medical_events.json`, blob, {
                    contentType: 'application/json',
                    upsert: true
                })

            if (error) {
                console.error("Error uploading to storage:", error)
                toast({
                    title: "Aviso",
                    description: "Salvo apenas localmente. Erro ao sincronizar com a nuvem.",
                    variant: "destructive"
                })
            }
        } catch (err) {
            console.error("Error saving to cloud:", err)
        }
    }

    const handleAddEvent = () => {
        if (!date || !newEventTitle || !newEventTime) return

        const newEvent: MedicalEvent = {
            id: crypto.randomUUID(),
            title: newEventTitle,
            date: date.toISOString(),
            time: newEventTime,
            type: newEventType,
        }

        const updatedEvents = [...events, newEvent]
        saveEventsToStorage(updatedEvents)

        // Reset form
        setNewEventTitle("")
        setNewEventTime("")
    }

    const handleDeleteEvent = (id: string) => {
        const updatedEvents = events.filter(e => e.id !== id)
        saveEventsToStorage(updatedEvents)
    }

    const selectedDateEvents = events.filter(event =>
        date && new Date(event.date).toDateString() === date.toDateString()
    )

    const getEventTypeColor = (type: string) => {
        switch (type) {
            case "consulta": return "bg-blue-100 text-blue-700 border-blue-200"
            case "exame": return "bg-purple-100 text-purple-700 border-purple-200"
            case "vacina": return "bg-emerald-100 text-emerald-700 border-emerald-200"
            default: return "bg-gray-100 text-gray-700 border-gray-200"
        }
    }

    return (
        <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
                <div className="bg-indigo-100 p-2 rounded-lg">
                    <CalendarIcon className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Calendário Médico</h3>
                    <p className="text-sm text-gray-500">Gerencie suas consultas e exames</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-8 items-start">
                {/* Left Column: Calendar */}
                <div className="flex justify-center lg:justify-start">
                    <div className="p-4 border border-gray-100 rounded-xl bg-white shadow-sm">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            className="rounded-md"
                            locale={ptBR}
                        />
                    </div>
                </div>

                {/* Right Column: Content */}
                <div className="space-y-6">
                    {/* Header for Selected Date */}
                    <div className="flex items-center justify-between">
                        <h4 className="text-xl font-semibold text-gray-800 capitalize">
                            {date ? format(date, "EEEE, dd 'de' MMMM", { locale: ptBR }) : "Selecione uma data"}
                        </h4>
                        <Badge variant="secondary" className="px-3 py-1">
                            {selectedDateEvents.length} {selectedDateEvents.length === 1 ? 'evento' : 'eventos'}
                        </Badge>
                    </div>

                    {/* Add Event Form - Compact */}
                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 transition-all hover:border-gray-200">
                        <h5 className="text-sm font-medium mb-3 text-gray-700 flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Novo Agendamento
                        </h5>
                        <div className="space-y-3">
                            <Input
                                value={newEventTitle}
                                onChange={(e) => setNewEventTitle(e.target.value)}
                                placeholder="Título (ex: Consulta Cardiologista)"
                                className="bg-white"
                            />
                            <div className="flex gap-3">
                                <div className="w-32">
                                    <Input
                                        type="time"
                                        value={newEventTime}
                                        onChange={(e) => setNewEventTime(e.target.value)}
                                        className="bg-white"
                                    />
                                </div>
                                <div className="flex-1">
                                    <Select value={newEventType} onValueChange={(v: any) => setNewEventType(v)}>
                                        <SelectTrigger className="bg-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="consulta">Consulta</SelectItem>
                                            <SelectItem value="exame">Exame</SelectItem>
                                            <SelectItem value="vacina">Vacina</SelectItem>
                                            <SelectItem value="outro">Outro</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button onClick={handleAddEvent} className="bg-indigo-600 hover:bg-indigo-700">
                                    Adicionar
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Events List */}
                    <div className="space-y-3">
                        {selectedDateEvents.length === 0 ? (
                            <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-xl">
                                <p className="text-gray-400 text-sm">Nenhum evento agendado para este dia.</p>
                            </div>
                        ) : (
                            selectedDateEvents.map(event => (
                                <div
                                    key={event.id}
                                    className="group flex items-center justify-between p-4 border border-gray-100 rounded-xl bg-white hover:shadow-md transition-all hover:border-indigo-100"
                                >
                                    <div className="flex gap-4 items-center">
                                        <div className={`p-2 rounded-lg border ${getEventTypeColor(event.type)} bg-opacity-10 border-opacity-20`}>
                                            <Clock className="w-5 h-5 opacity-80" />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-900 flex items-center gap-2">
                                                {event.title}
                                                <Badge variant="outline" className={`text-xs border-0 ${getEventTypeColor(event.type)}`}>
                                                    {event.type}
                                                </Badge>
                                            </div>
                                            <div className="text-sm text-gray-500 mt-0.5 font-medium">
                                                {event.time}
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeleteEvent(event.id)}
                                        className="text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                        aria-label={`Excluir evento ${event.title}`}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
