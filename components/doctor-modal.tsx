"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Stethoscope, UserRound, MapPin, Phone, FileText, Calendar } from "lucide-react"
import type { Doctor } from "@/lib/types"

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    userId: string
    onSuccess: () => void
    doctorToEdit?: Doctor
}

export function DoctorModal({ open, onOpenChange, userId, onSuccess, doctorToEdit }: Props) {
    const [loading, setLoading] = useState(false)
    const { toast } = useToast()

    const [name, setName] = useState("")
    const [specialty, setSpecialty] = useState("")
    const [customSpecialty, setCustomSpecialty] = useState("")
    const [address, setAddress] = useState("")
    const [contact, setContact] = useState("")
    const [crm, setCrm] = useState("")
    const [lastAppointment, setLastAppointment] = useState("")
    const [nextAppointment, setNextAppointment] = useState("")

    const specialties = [
        "Endocrinologista",
        "Nutricionista",
        "Cardiologista",
        "Clínico Geral",
        "Oftalmologista",
        "Outro",
    ]

    useEffect(() => {
        if (doctorToEdit) {
            setName(doctorToEdit.name)
            if (specialties.includes(doctorToEdit.specialty)) {
                setSpecialty(doctorToEdit.specialty)
                setCustomSpecialty("")
            } else {
                setSpecialty("Outro")
                setCustomSpecialty(doctorToEdit.specialty)
            }
            setAddress(doctorToEdit.address || "")
            setContact(doctorToEdit.contact || "")
            setCrm(doctorToEdit.crm || "")
            setLastAppointment(doctorToEdit.last_appointment || "")
            setNextAppointment(doctorToEdit.next_appointment || "")
        } else {
            resetForm()
        }
    }, [doctorToEdit, open])

    const resetForm = () => {
        setName("")
        setSpecialty("Endocrinologista")
        setCustomSpecialty("")
        setAddress("")
        setContact("")
        setCrm("")
        setLastAppointment("")
        setNextAppointment("")
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const supabase = createClient()
            const finalSpecialty = specialty === "Outro" ? customSpecialty : specialty

            const doctorData = {
                user_id: userId,
                name,
                specialty: finalSpecialty,
                address: address || null,
                contact: contact || null,
                crm: crm || null,
                last_appointment: lastAppointment || null,
                next_appointment: nextAppointment || null,
            }

            if (doctorToEdit) {
                const { error } = await supabase
                    .from("doctors")
                    .update(doctorData)
                    .eq("id", doctorToEdit.id)
                if (error) throw error
                toast({ title: "Médico atualizado com sucesso!" })
            } else {
                const { error } = await supabase.from("doctors").insert(doctorData)
                if (error) throw error
                toast({ title: "Médico adicionado com sucesso!" })
            }

            onSuccess()
            onOpenChange(false)
            resetForm()
        } catch (error) {
            console.error("Erro ao salvar médico:", error)
            toast({
                title: "Erro ao salvar",
                description: "Tente novamente mais tarde.",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <div className="bg-teal-100 dark:bg-teal-900/40 p-2 rounded-lg">
                            <Stethoscope className="w-5 h-5 text-teal-700 dark:text-teal-300" />
                        </div>
                        {doctorToEdit ? "Editar Médico" : "Novo Médico"}
                    </DialogTitle>
                    <DialogDescription>
                        {doctorToEdit ? "Atualize as informações do médico." : "Cadastre um novo especialista."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div>
                        <Label htmlFor="name" className="flex items-center gap-2">
                            <UserRound className="w-4 h-4 text-muted-foreground" /> Nome do Médico
                        </Label>
                        <Input
                            id="name"
                            placeholder="Dr. Fulano de Tal"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <Label htmlFor="specialty" className="flex items-center gap-2">
                            <Stethoscope className="w-4 h-4 text-muted-foreground" /> Especialidade
                        </Label>
                        <select
                            id="specialty"
                            value={specialty}
                            onChange={(e) => setSpecialty(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                        >
                            {specialties.map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>
                    </div>

                    {specialty === "Outro" && (
                        <div>
                            <Label htmlFor="customSpecialty">Qual especialidade?</Label>
                            <Input
                                id="customSpecialty"
                                value={customSpecialty}
                                onChange={(e) => setCustomSpecialty(e.target.value)}
                                required
                                className="mt-1"
                                placeholder="Ex: Neurologista"
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="crm" className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-muted-foreground" /> CRM
                            </Label>
                            <Input
                                id="crm"
                                placeholder="12345/SP"
                                value={crm}
                                onChange={(e) => setCrm(e.target.value)}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="contact" className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-muted-foreground" /> Contato
                            </Label>
                            <Input
                                id="contact"
                                placeholder="(11) 99999-9999"
                                value={contact}
                                onChange={(e) => setContact(e.target.value)}
                                className="mt-1"
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="address" className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" /> Local de Atendimento
                        </Label>
                        <Input
                            id="address"
                            placeholder="Endereço ou nome da clínica"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="mt-1"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="lastAppointment" className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-muted-foreground" /> Última Consulta
                            </Label>
                            <Input
                                id="lastAppointment"
                                type="date"
                                value={lastAppointment}
                                onChange={(e) => setLastAppointment(e.target.value)}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="nextAppointment" className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-muted-foreground" /> Próxima Consulta
                            </Label>
                            <Input
                                id="nextAppointment"
                                type="date"
                                value={nextAppointment}
                                onChange={(e) => setNextAppointment(e.target.value)}
                                className="mt-1"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white">
                            {loading ? "Salvando..." : "Salvar"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
