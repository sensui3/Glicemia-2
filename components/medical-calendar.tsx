"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Calendar } from "@/components/ui/calendar"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Trash2, Plus, Calendar as CalendarIcon, MapPin } from "lucide-react"
import { ptBR } from "date-fns/locale"
import { format } from "date-fns"

type MedicalEvent = {
    id: string
    title: string
    date: string
    time: string
    type: "consulta" | "exame" | "vacina" | "outro"
    location?: string
}

type Props = {
    userId: string
}

export function MedicalCalendar({ userId }: Props) {
    const { toast } = useToast()
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [events, setEvents] = useState<MedicalEvent[]>([])
    const [isModalOpen, setIsModalOpen] = useState(false)

    // Form State
    const [newEventTitle, setNewEventTitle] = useState("")
    const [newEventTime, setNewEventTime] = useState("")
    const [newEventLocation, setNewEventLocation] = useState("")
    const [newEventType, setNewEventType] = useState<"consulta" | "exame" | "vacina" | "outro">("consulta")
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    useEffect(() => {
        loadEvents()
    }, [userId])

    const loadEvents = async () => {
        const storedEvents = localStorage.getItem(`medical_events_${userId}`)
        if (storedEvents) {
            setEvents(JSON.parse(storedEvents))
        }

        try {
            const supabase = createClient()
            const { data, error } = await supabase.storage
                .from('user_data')
                .download(`${userId}/medical_events.json`)

            if (data) {
                const text = await data.text()
                const remoteEvents = JSON.parse(text)
                setEvents(remoteEvents)
                localStorage.setItem(`medical_events_${userId}`, text)
            }
        } catch (err) {
            console.error("Error loading remote events:", err)
        }
    }

    const saveEventsToStorage = async (updatedEvents: MedicalEvent[]) => {
        const jsonString = JSON.stringify(updatedEvents)
        localStorage.setItem(`medical_events_${userId}`, jsonString)
        setEvents(updatedEvents)

        try {
            const supabase = createClient()
            const blob = new Blob([jsonString], { type: 'application/json' })
            await supabase.storage
                .from('user_data')
                .upload(`${userId}/medical_events.json`, blob, {
                    contentType: 'application/json',
                    upsert: true
                })
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
            location: newEventLocation
        }

        const updatedEvents = [...events, newEvent]
        saveEventsToStorage(updatedEvents)

        setNewEventTitle("")
        setNewEventTime("")
        setNewEventLocation("")

        toast({ title: "Agendamento salvo!", description: "Seu evento foi adicionado com sucesso." })
    }

    const handleDeleteEvent = (id: string) => {
        const updatedEvents = events.filter(e => e.id !== id)
        saveEventsToStorage(updatedEvents)
    }

    const handleDateSelect = (selectedDate: Date | undefined) => {
        setDate(selectedDate)
        if (selectedDate) {
            setIsModalOpen(true)
        }
    }

    const selectedDateEvents = events.filter(event =>
        date && new Date(event.date).toDateString() === date.toDateString()
    )

    const getEventTypeColor = (type: string) => {
        switch (type) {
            case "consulta": return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"
            case "exame": return "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800"
            case "vacina": return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800"
            default: return "bg-muted text-muted-foreground border-border"
        }
    }

    const modifiers = {
        hasEvent: (date: Date) => events.some(e => new Date(e.date).toDateString() === date.toDateString())
    }
    const modifiersStyles = {
        hasEvent: { textDecoration: "underline", fontWeight: "bold", color: "var(--primary)" }
    }

    return (
        <div className="bg-card rounded-xl shadow-sm p-6 border border-border h-full flex flex-col">
            <div className="flex items-center gap-2 mb-4 border-b border-border pb-4">
                <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg">
                    <CalendarIcon className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-foreground">Calendário Médico</h3>
                    <p className="text-sm text-muted-foreground">Gerencie consultas</p>
                </div>
            </div>

            <div className="flex-1 flex justify-center w-full">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={handleDateSelect}
                    className="rounded-md border shadow-sm p-4 w-full max-w-full flex justify-center"
                    locale={ptBR}
                    modifiers={modifiers}
                    modifiersStyles={modifiersStyles}
                />
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>
                            {date ? format(date, "d 'de' MMMM", { locale: ptBR }) : "Detalhes"}
                        </DialogTitle>
                        <DialogDescription>
                            Gerencie seus agendamentos para este dia.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 pt-4">
                        {/* Events List */}
                        <div className="space-y-3 min-h-[100px] max-h-[200px] overflow-y-auto pr-1">
                            {selectedDateEvents.length === 0 ? (
                                <p className="text-center text-muted-foreground text-sm py-4 italic">Nenhum evento agendado.</p>
                            ) : (
                                selectedDateEvents.map(event => (
                                    <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                                        <div className="flex gap-3 items-center">
                                            <Badge variant="outline" className={`${getEventTypeColor(event.type)} capitalize`}>
                                                {event.type}
                                            </Badge>
                                            <div>
                                                <p className="font-medium text-sm text-foreground">{event.title}</p>
                                                {event.location && (
                                                    <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
                                                        <MapPin className="w-3 h-3" />
                                                        {event.location}
                                                    </p>
                                                )}
                                                <p className="text-xs text-muted-foreground">{event.time}</p>
                                            </div>
                                        </div>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteEvent(event.id)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Add Form */}
                        <div className="bg-muted p-4 rounded-xl space-y-3">
                            <h4 className="text-sm font-medium flex items-center gap-2">
                                <Plus className="w-4 h-4" /> Novo Agendamento
                            </h4>
                            <Input
                                value={newEventTitle}
                                onChange={(e) => setNewEventTitle(e.target.value)}
                                placeholder="Título (ex: Cardiologista)"
                                className="h-9 bg-background"
                            />
                            <Input
                                value={newEventLocation}
                                onChange={(e) => setNewEventLocation(e.target.value)}
                                placeholder="Loca da consulta (Opcional)"
                                className="h-9 bg-background"
                            />
                            <div className="flex gap-2">
                                <Input
                                    type="time"
                                    value={newEventTime}
                                    onChange={(e) => setNewEventTime(e.target.value)}
                                    className="h-9 w-24 bg-background"
                                />
                                {isMounted && (
                                    <Select value={newEventType} onValueChange={(v: any) => setNewEventType(v)}>
                                        <SelectTrigger className="h-9 bg-background flex-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="consulta">Consulta</SelectItem>
                                            <SelectItem value="exame">Exame</SelectItem>
                                            <SelectItem value="vacina">Vacina</SelectItem>
                                            <SelectItem value="outro">Outro</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                            <Button onClick={handleAddEvent} className="w-full h-9 bg-indigo-600 hover:bg-indigo-700">Adicionar</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
