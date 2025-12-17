"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Download, FileJson, Info, CheckCircle2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

export function DataExportDialog() {
    const [open, setOpen] = useState(false)
    const [exporting, setExporting] = useState(false)
    const [success, setSuccess] = useState(false)

    const handleExport = async () => {
        try {
            setExporting(true)
            setSuccess(false)

            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                throw new Error("Usuário não autenticado")
            }

            // Chamar função RPC do Supabase para exportar dados
            const { data, error } = await supabase.rpc("export_user_data", {
                p_user_id: user.id
            })

            if (error) throw error

            // Criar arquivo JSON para download
            const jsonString = JSON.stringify(data, null, 2)
            const blob = new Blob([jsonString], { type: "application/json" })
            const url = window.URL.createObjectURL(blob)

            // Criar link de download
            const a = document.createElement("a")
            a.href = url
            a.download = `meus-dados-glicemia-${new Date().toISOString().split("T")[0]}.json`
            document.body.appendChild(a)
            a.click()

            // Limpar
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)

            setSuccess(true)

            toast({
                title: "Dados exportados com sucesso!",
                description: "O arquivo foi baixado para o seu dispositivo.",
                duration: 5000,
            })

            // Fechar modal após 2 segundos
            setTimeout(() => {
                setOpen(false)
                setSuccess(false)
            }, 2000)

        } catch (err) {
            console.error("Erro ao exportar dados:", err)
            toast({
                title: "Erro ao exportar dados",
                description: "Ocorreu um erro ao exportar seus dados. Tente novamente.",
                variant: "destructive",
                duration: 5000,
            })
        } finally {
            setExporting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start gap-2">
                    <Download className="w-4 h-4" />
                    Exportar Meus Dados
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileJson className="w-5 h-5 text-primary" />
                        Exportar Dados Pessoais
                    </DialogTitle>
                    <DialogDescription>
                        Direito à Portabilidade de Dados (LGPD Art. 18, V)
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                            Você receberá um arquivo JSON contendo todos os seus dados armazenados no sistema:
                        </AlertDescription>
                    </Alert>

                    <ul className="space-y-2 text-sm text-muted-foreground ml-4">
                        <li className="flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span>Perfil e configurações</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span>Registros de glicemia</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span>Refeições e alimentos</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span>Medicações</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span>Médicos e consultas</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span>Histórico de consentimentos</span>
                        </li>
                    </ul>

                    {success && (
                        <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <AlertDescription className="text-green-800 dark:text-green-200">
                                Dados exportados com sucesso!
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={exporting}
                        className="w-full sm:w-auto"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleExport}
                        disabled={exporting || success}
                        className="w-full sm:w-auto"
                    >
                        {exporting ? (
                            <>
                                <Download className="w-4 h-4 mr-2 animate-bounce" />
                                Exportando...
                            </>
                        ) : success ? (
                            <>
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Concluído
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4 mr-2" />
                                Baixar Dados
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
