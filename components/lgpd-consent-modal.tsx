"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, FileText, Database, Mail } from "lucide-react"
import Link from "next/link"

type ConsentType = {
    type: "terms" | "privacy" | "data_processing" | "marketing"
    label: string
    description: string
    required: boolean
    icon: React.ReactNode
    linkText: string
    linkHref: string
}

const CONSENT_TYPES: ConsentType[] = [
    {
        type: "terms",
        label: "Termos de Uso",
        description: "Li e aceito os Termos de Uso do sistema",
        required: true,
        icon: <FileText className="w-5 h-5 text-primary" />,
        linkText: "Ler termos completos",
        linkHref: "/terms"
    },
    {
        type: "privacy",
        label: "Política de Privacidade",
        description: "Li e aceito a Política de Privacidade",
        required: true,
        icon: <Shield className="w-5 h-5 text-primary" />,
        linkText: "Ler política completa",
        linkHref: "/privacy"
    },
    {
        type: "data_processing",
        label: "Processamento de Dados de Saúde",
        description: "Autorizo o processamento dos meus dados de saúde para fins de controle glicêmico",
        required: true,
        icon: <Database className="w-5 h-5 text-primary" />,
        linkText: "Saiba mais sobre o tratamento de dados",
        linkHref: "/privacy#data-processing"
    },
    {
        type: "marketing",
        label: "Comunicações e Novidades (Opcional)",
        description: "Desejo receber comunicações sobre atualizações e novidades do sistema",
        required: false,
        icon: <Mail className="w-5 h-5 text-muted-foreground" />,
        linkText: "Como usamos seus dados para comunicação",
        linkHref: "/privacy#marketing"
    }
]

export function LGPDConsentModal() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [consents, setConsents] = useState<Record<string, boolean>>({
        terms: false,
        privacy: false,
        data_processing: false,
        marketing: false
    })
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    useEffect(() => {
        checkUserConsent()
    }, [])

    const checkUserConsent = async () => {
        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                setLoading(false)
                return
            }

            // Verificar se usuário já deu consentimento
            const { data: existingConsents, error } = await supabase
                .from("user_consents")
                .select("consent_type, consent_given")
                .eq("user_id", user.id)
                .is("revoked_at", null)

            if (error) throw error

            type UserConsent = { consent_type: string; consent_given: boolean }

            // Se não tem consentimentos obrigatórios, mostrar modal
            const hasRequiredConsents = CONSENT_TYPES
                .filter(c => c.required)
                .every(c =>
                    existingConsents?.some((ec: UserConsent) =>
                        ec.consent_type === c.type && ec.consent_given
                    )
                )

            if (!hasRequiredConsents) {
                // Preencher consentimentos existentes
                const currentConsents = { ...consents }
                existingConsents?.forEach((ec: UserConsent) => {
                    currentConsents[ec.consent_type] = ec.consent_given
                })
                setConsents(currentConsents)
                setOpen(true)
            }

            setLoading(false)
        } catch (err) {
            console.error("Erro ao verificar consentimentos:", err)
            setLoading(false)
        }
    }

    const handleConsentChange = (type: string, checked: boolean) => {
        setConsents(prev => ({ ...prev, [type]: checked }))
        setError(null)
    }

    const handleSaveConsents = async () => {
        try {
            // Validar consentimentos obrigatórios
            const missingRequired = CONSENT_TYPES
                .filter(c => c.required && !consents[c.type])
                .map(c => c.label)

            if (missingRequired.length > 0) {
                setError(`Por favor, aceite: ${missingRequired.join(", ")}`)
                return
            }

            setSaving(true)
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                throw new Error("Usuário não autenticado")
            }

            // Deletar consentimentos antigos do usuário (se existirem)
            await supabase
                .from("user_consents")
                .delete()
                .eq("user_id", user.id)

            // Inserir novos consentimentos
            const consentRecords = Object.entries(consents).map(([type, given]) => ({
                user_id: user.id,
                consent_type: type,
                consent_given: given,
                consent_version: "1.0",
                ip_address: null,
                user_agent: typeof window !== "undefined" ? window.navigator.userAgent : null
            }))

            const { error: insertError } = await supabase
                .from("user_consents")
                .insert(consentRecords)

            if (insertError) {
                console.error("Erro detalhado:", insertError)
                throw insertError
            }

            setOpen(false)
            router.refresh()
        } catch (err: any) {
            console.error("Erro ao salvar consentimentos:", err)
            setError(err.message || "Erro ao salvar consentimentos. Tente novamente.")
        } finally {
            setSaving(false)
        }
    }

    if (loading) return null

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh]" onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle className="text-2xl">Consentimento de Uso de Dados</DialogTitle>
                    <DialogDescription>
                        Para utilizar o sistema de Controle de Glicemia, precisamos do seu consentimento
                        para processar seus dados de saúde conforme a LGPD (Lei Geral de Proteção de Dados).
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[50vh] pr-4">
                    <div className="space-y-6 py-4">
                        {CONSENT_TYPES.map((consent) => (
                            <div key={consent.type} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                <div className="mt-1">{consent.icon}</div>
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-start gap-3">
                                        <Checkbox
                                            id={consent.type}
                                            checked={consents[consent.type]}
                                            onCheckedChange={(checked) =>
                                                handleConsentChange(consent.type, checked as boolean)
                                            }
                                            className="mt-1"
                                        />
                                        <div className="flex-1">
                                            <Label
                                                htmlFor={consent.type}
                                                className="text-base font-medium cursor-pointer"
                                            >
                                                {consent.label}
                                                {consent.required && (
                                                    <span className="text-destructive ml-1">*</span>
                                                )}
                                            </Label>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {consent.description}
                                            </p>
                                            <Link
                                                href={consent.linkHref}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm text-primary hover:underline inline-flex items-center gap-1 mt-2"
                                            >
                                                {consent.linkText}
                                                <span className="text-xs">↗</span>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>

                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <p className="text-xs text-muted-foreground flex-1">
                        * Campos obrigatórios para utilizar o sistema
                    </p>
                    <Button
                        onClick={handleSaveConsents}
                        disabled={saving}
                        className="w-full sm:w-auto"
                    >
                        {saving ? "Salvando..." : "Aceitar e Continuar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
