import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <Link href="/dashboard">
                    <Button variant="ghost" className="mb-6">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Voltar ao Dashboard
                    </Button>
                </Link>

                <div className="prose dark:prose-invert max-w-none">
                    <h1 className="text-4xl font-bold mb-2">Termos de Uso</h1>
                    <p className="text-muted-foreground mb-8">
                        Última atualização: {new Date().toLocaleDateString("pt-BR")}
                    </p>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">1. Aceitação dos Termos</h2>
                        <p>
                            Ao acessar e usar o sistema de Controle de Glicemia, você concorda em cumprir e estar
                            vinculado aos seguintes termos e condições de uso. Se você não concordar com qualquer
                            parte destes termos, não deverá usar este sistema.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">2. Descrição do Serviço</h2>
                        <p>
                            O sistema de Controle de Glicemia é uma ferramenta de auxílio ao monitoramento
                            glicêmico pessoal. O sistema permite:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Registro de medições de glicemia</li>
                            <li>Acompanhamento de refeições e impacto glicêmico</li>
                            <li>Gestão de medicações</li>
                            <li>Agendamento de consultas médicas</li>
                            <li>Visualização de estatísticas e tendências</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">3. Uso Adequado</h2>
                        <p className="font-semibold text-orange-600 dark:text-orange-400 mb-4">
                            ⚠️ IMPORTANTE: Este sistema NÃO substitui orientação médica profissional
                        </p>
                        <p>Você concorda em:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Usar o sistema apenas para fins de monitoramento pessoal</li>
                            <li>Não compartilhar suas credenciais de acesso</li>
                            <li>Manter a confidencialidade de seus dados de login</li>
                            <li>Consultar sempre um profissional de saúde para decisões médicas</li>
                            <li>Não usar o sistema como única fonte de informação para tratamento médico</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">4. Responsabilidades do Usuário</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>
                                <strong>Precisão dos Dados:</strong> Você é responsável pela precisão e veracidade
                                dos dados inseridos no sistema
                            </li>
                            <li>
                                <strong>Segurança:</strong> Manter a segurança de sua conta e senha
                            </li>
                            <li>
                                <strong>Uso Pessoal:</strong> O sistema é para uso pessoal e não comercial
                            </li>
                            <li>
                                <strong>Backup:</strong> Recomendamos exportar seus dados periodicamente
                            </li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">5. Limitações de Responsabilidade</h2>
                        <p>
                            O sistema é fornecido "como está" e "conforme disponível". Não garantimos que:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>O serviço será ininterrupto ou livre de erros</li>
                            <li>Os resultados obtidos serão precisos ou confiáveis</li>
                            <li>Defeitos serão corrigidos imediatamente</li>
                        </ul>
                        <p className="mt-4">
                            <strong>Não nos responsabilizamos por:</strong>
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Decisões médicas tomadas com base nos dados do sistema</li>
                            <li>Perda de dados devido a falhas técnicas</li>
                            <li>Danos indiretos ou consequenciais</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">6. Propriedade Intelectual</h2>
                        <p>
                            Todo o conteúdo, design, código e funcionalidades do sistema são de propriedade
                            exclusiva e protegidos por leis de direitos autorais. Você não pode:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Copiar, modificar ou distribuir o código do sistema</li>
                            <li>Fazer engenharia reversa</li>
                            <li>Usar o sistema para criar produtos derivados</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">7. Privacidade e Proteção de Dados</h2>
                        <p>
                            O tratamento de seus dados pessoais e de saúde está descrito em nossa{" "}
                            <Link href="/privacy" className="text-primary hover:underline">
                                Política de Privacidade
                            </Link>
                            , que é parte integrante destes Termos de Uso.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">8. Modificações dos Termos</h2>
                        <p>
                            Reservamo-nos o direito de modificar estes termos a qualquer momento. Alterações
                            significativas serão notificadas por e-mail ou através do sistema. O uso continuado
                            após as alterações constitui aceitação dos novos termos.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">9. Encerramento</h2>
                        <p>Podemos encerrar ou suspender seu acesso ao sistema imediatamente, sem aviso prévio, por:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Violação destes Termos de Uso</li>
                            <li>Uso inadequado ou fraudulento</li>
                            <li>Solicitação do próprio usuário</li>
                        </ul>
                        <p className="mt-4">
                            Você pode encerrar sua conta a qualquer momento através das configurações do sistema,
                            exercendo seu direito ao esquecimento conforme a LGPD.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">10. Lei Aplicável</h2>
                        <p>
                            Estes termos são regidos pelas leis da República Federativa do Brasil. Quaisquer
                            disputas serão resolvidas nos tribunais competentes do Brasil.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">11. Contato</h2>
                        <p>
                            Para questões sobre estes Termos de Uso, entre em contato através do e-mail de suporte
                            disponível nas configurações do sistema.
                        </p>
                    </section>

                    <div className="mt-12 p-6 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">
                            Ao usar o sistema de Controle de Glicemia, você reconhece que leu, compreendeu e
                            concorda em estar vinculado a estes Termos de Uso.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
