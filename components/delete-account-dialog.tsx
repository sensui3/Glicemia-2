"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Trash2, AlertTriangle, ShieldAlert } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

export function DeleteAccountDialog() {
    const [open, setOpen] = useState(false)
    const [confirmText, setConfirmText] = useState("")
    const [deleting, setDeleting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const CONFIRMATION_TEXT = "EXCLUIR MEUS DADOS"

    const handleDeleteAccount = async () => {
        try {
            if (confirmText !== CONFIRMATION_TEXT) {
                setError("Texto de confirmação incorreto")
                return
            }

            setDeleting(true)
            setError(null)

            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                throw new Error("Usuário não autenticado")
            }

            // Chamar função RPC do Supabase para deletar dados
            const { data, error: deleteError } = await supabase.rpc("delete_user_data_gdpr", {
                p_user_id: user.id
            })

            if (deleteError) throw deleteError

            // Fazer logout
            await supabase.auth.signOut()

            toast({
                title: "Conta excluída com sucesso",
                description: "Todos os seus dados foram permanentemente removidos.",
                duration: 5000,
            })

            // Redirecionar para página inicial
            router.push("/")
            router.refresh()

        } catch (err) {
            console.error("Erro ao deletar conta:", err)
            setError("Erro ao excluir conta. Tente novamente ou entre em contato com o suporte.")
            setDeleting(false)
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full justify-start gap-2">
                    <Trash2 className="w-4 h-4" />
                    Excluir Minha Conta
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                        <ShieldAlert className="w-5 h-5" />
                        Excluir Conta Permanentemente
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Direito ao Esquecimento (LGPD Art. 18, VI)
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="space-y-4 py-4">
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="font-semibold">
                            Esta ação é IRREVERSÍVEL!
                        </AlertDescription>
                    </Alert>

                    <div className="space-y-2 text-sm text-muted-foreground">
                        <p className="font-medium text-foreground">
                            Os seguintes dados serão permanentemente excluídos:
                        </p>
                        <ul className="space-y-1 ml-4">
                            <li className="flex items-start gap-2">
                                <span className="text-destructive mt-1">•</span>
                                <span>Todos os registros de glicemia</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-destructive mt-1">•</span>
                                <span>Histórico de refeições e alimentos</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-destructive mt-1">•</span>
                                <span>Medicações cadastradas</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-destructive mt-1">•</span>
                                <span>Médicos e consultas</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-destructive mt-1">•</span>
                                <span>Perfil e configurações</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-destructive mt-1">•</span>
                                <span>Conta de acesso</span>
                            </li>
                        </ul>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirm-text" className="text-sm font-medium">
                            Para confirmar, digite: <span className="font-mono font-bold">{CONFIRMATION_TEXT}</span>
                        </Label>
                        <Input
                            id="confirm-text"
                            type="text"
                            value={confirmText}
                            onChange={(e) => {
                                setConfirmText(e.target.value)
                                setError(null)
                            }}
                            placeholder="Digite o texto de confirmação"
                            className="font-mono"
                            disabled={deleting}
                        />
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <Alert>
                        <AlertDescription className="text-xs">
                            <strong>Nota:</strong> Os logs de auditoria serão mantidos de forma anonimizada
                            para fins de compliance legal, mas sem qualquer identificação pessoal.
                        </AlertDescription>
                    </Alert>
                </div>

                <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                    <AlertDialogCancel disabled={deleting} className="w-full sm:w-auto">
                        Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDeleteAccount}
                        disabled={confirmText !== CONFIRMATION_TEXT || deleting}
                        className="w-full sm:w-auto bg-destructive hover:bg-destructive/90"
                    >
                        {deleting ? (
                            <>
                                <Trash2 className="w-4 h-4 mr-2 animate-pulse" />
                                Excluindo...
                            </>
                        ) : (
                            <>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Excluir Permanentemente
                            </>
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
