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
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Buscar médico ou especialidade..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                    />
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white">
                    <Plus className="w-4 h-4 mr-2" /> Novo Médico
                </Button>
            </div>

            {loading ? (
                <div className="text-center py-10 text-gray-500">Carregando médicos...</div>
            ) : filteredDoctors.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <Stethoscope className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <h3 className="text-lg font-medium text-gray-900">Nenhum médico encontrado</h3>
                    <p className="text-gray-500 max-w-sm mx-auto mt-1">
                        {searchTerm ? "Tente buscar com outros termos." : "Cadastre seus médicos para ter as informações sempre à mão."}
                    </p>
                    {!searchTerm && (
                        <Button onClick={() => setIsModalOpen(true)} variant="outline" className="mt-4">
                            <Plus className="w-4 h-4 mr-2" /> Cadastrar Agora
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDoctors.map(doctor => (
                        <div key={doctor.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-teal-50 p-2.5 rounded-full">
                                            <Stethoscope className="w-5 h-5 text-teal-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 line-clamp-1" title={doctor.name}>{doctor.name}</h3>
                                            <p className="text-sm text-teal-600 font-medium">{doctor.specialty}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEdit(doctor)}>
                                            <Edit2 className="w-4 h-4 text-gray-400 hover:text-blue-600" />
                                        </Button>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleDeleteClick(doctor)}>
                                            <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-600" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-3 text-sm text-gray-600">
                                    {doctor.address && (
                                        <div className="flex items-start gap-2">
                                            <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                            <span className="line-clamp-2">{doctor.address}</span>
                                        </div>
                                    )}
                                    {doctor.contact && (
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                            <span>{doctor.contact}</span>
                                        </div>
                                    )}
                                    {doctor.crm && (
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                            <span>CRM: {doctor.crm}</span>
                                        </div>
                                    )}
                                </div>

                                {(doctor.last_appointment || doctor.next_appointment) && (
                                    <div className="mt-4 pt-4 border-t border-gray-50 grid grid-cols-2 gap-2 text-xs">
                                        {doctor.last_appointment && (
                                            <div>
                                                <span className="text-gray-400 block mb-1">Última Consulta</span>
                                                <div className="flex items-center gap-1.5 font-medium text-gray-700">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {format(new Date(doctor.last_appointment), "dd/MM/yyyy", { locale: ptBR })}
                                                </div>
                                            </div>
                                        )}
                                        {doctor.next_appointment && (
                                            <div>
                                                <span className="text-gray-400 block mb-1">Próxima Consulta</span>
                                                <div className="flex items-center gap-1.5 font-medium text-teal-700">
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
