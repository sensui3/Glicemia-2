"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Doctor } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { DoctorModal } from "@/components/doctor-modal"
import {
    Stethoscope,
    Plus,
    MapPin,
    Calendar,
    Phone,
    FileText,
    Edit2,
    Trash2,
    Search
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type Props = {
    userId: string
}

export function DoctorsList({ userId }: Props) {
    const [doctors, setDoctors] = useState<Doctor[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | undefined>(undefined)
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
    const [doctorToDelete, setDoctorToDelete] = useState<Doctor | null>(null)

    const { toast } = useToast()

    const loadDoctors = async () => {
        setLoading(true)
        const supabase = createClient()
        const { data, error } = await supabase
            .from("doctors")
            .select("*")
            .eq("user_id", userId)
            .order("name", { ascending: true })

        if (error) {
            console.error("Error fetching doctors:", error)
            toast({
                title: "Erro ao carregar médicos",
                variant: "destructive",
            })
        } else {
            setDoctors(data || [])
        }
        setLoading(false)
    }

    useEffect(() => {
        loadDoctors()
    }, [userId])

    const handleEdit = (doctor: Doctor) => {
        setSelectedDoctor(doctor)
        setIsModalOpen(true)
    }

    const handleDeleteClick = (doctor: Doctor) => {
        setDoctorToDelete(doctor)
        setDeleteConfirmOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (!doctorToDelete) return

        const supabase = createClient()
        const { error } = await supabase.from("doctors").delete().eq("id", doctorToDelete.id)

        if (error) {
            toast({
                title: "Erro ao excluir",
                description: "Não foi possível excluir o médico.",
                variant: "destructive",
            })
        } else {
            toast({
                title: "Médico excluído",
                description: "O registro foi removido com sucesso.",
            })
            loadDoctors()
        }
        setDeleteConfirmOpen(false)
        setDoctorToDelete(null)
    }

    const handleModalClose = (open: boolean) => {
        setIsModalOpen(open)
        if (!open) setSelectedDoctor(undefined)
    }

    const filteredDoctors = doctors.filter(doctor =>
        doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
            {/* Title Section */}
            <div>
                <h1 className="text-3xl font-bold mb-2 text-foreground">Meus Médicos</h1>
                <p className="text-muted-foreground">Gerencie sua equipe médica e consultas.</p>
            </div>

            <div className="space-y-6">
                {/* Main Action */}
                <div className="flex flex-col md:flex-row gap-4">
                    <Button
                        onClick={() => setIsModalOpen(true)}
                        className="h-24 text-xl font-bold bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98] w-full md:w-auto md:min-w-[350px]"
                    >
                        <Plus className="w-8 h-8 mr-3" />
                        NOVO MÉDICO
                    </Button>
                </div>

                <div className="border-b pb-6">
                    <div className="relative w-full md:max-w-md">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar médico ou especialidade..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 h-10"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-10 text-muted-foreground">Carregando médicos...</div>
                ) : filteredDoctors.length === 0 ? (
                    <div className="text-center py-16 bg-muted/30 rounded-xl border border-dashed border-border">
                        <div className="bg-background rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 border shadow-sm">
                            <Stethoscope className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-medium text-foreground">Nenhum médico encontrado</h3>
                        <p className="text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
                            {searchTerm ? "Tente buscar com outros termos." : "Cadastre seus médicos para ter as informações sempre à mão."}
                        </p>
                        {!searchTerm && (
                            <Button onClick={() => setIsModalOpen(true)} variant="outline">
                                <Plus className="w-4 h-4 mr-2" /> Cadastrar Agora
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredDoctors.map(doctor => (
                            <div key={doctor.id} className="bg-card rounded-xl shadow-sm border border-border overflow-hidden hover:shadow-md transition-shadow group">
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-teal-50 dark:bg-teal-900/30 p-3 rounded-full group-hover:scale-105 transition-transform">
                                                <Stethoscope className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-foreground text-lg line-clamp-1" title={doctor.name}>{doctor.name}</h3>
                                                <p className="text-sm text-teal-600 dark:text-teal-400 font-medium">{doctor.specialty}</p>
                                            </div>
                                        </div>
                                        <div className="flex -mr-2">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-blue-600" onClick={() => handleEdit(doctor)}>
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600" onClick={() => handleDeleteClick(doctor)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-3 text-sm text-muted-foreground pb-2">
                                        {doctor.address && (
                                            <div className="flex items-start gap-2.5">
                                                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                                <span className="line-clamp-2">{doctor.address}</span>
                                            </div>
                                        )}
                                        {doctor.contact && (
                                            <div className="flex items-center gap-2.5">
                                                <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                <span>{doctor.contact}</span>
                                            </div>
                                        )}
                                        {doctor.crm && (
                                            <div className="flex items-center gap-2.5">
                                                <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                <span>CRM: {doctor.crm}</span>
                                            </div>
                                        )}
                                    </div>

                                    {(doctor.last_appointment || doctor.next_appointment) && (
                                        <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-4 text-xs">
                                            {doctor.last_appointment && (
                                                <div>
                                                    <span className="text-muted-foreground block mb-1">Última Consulta</span>
                                                    <div className="flex items-center gap-1.5 font-medium text-foreground">
                                                        <Calendar className="w-3.5 h-3.5 opacity-70" />
                                                        {format(new Date(doctor.last_appointment), "dd/MM/yyyy", { locale: ptBR })}
                                                    </div>
                                                </div>
                                            )}
                                            {doctor.next_appointment && (
                                                <div>
                                                    <span className="text-muted-foreground block mb-1">Próxima Consulta</span>
                                                    <div className="flex items-center gap-1.5 font-medium text-teal-700 dark:text-teal-400">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        {format(new Date(doctor.next_appointment), "dd/MM/yyyy", { locale: ptBR })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <DoctorModal
                open={isModalOpen}
                onOpenChange={handleModalClose}
                userId={userId}
                onSuccess={loadDoctors}
                doctorToEdit={selectedDoctor}
            />

            <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente o médico da sua lista.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
