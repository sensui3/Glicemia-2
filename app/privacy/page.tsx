import { ArrowLeft, Shield, Database, Eye, Lock, UserX, Download } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function PrivacyPage() {
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
                    <h1 className="text-4xl font-bold mb-2">Política de Privacidade</h1>
                    <p className="text-muted-foreground mb-8">
                        Última atualização: {new Date().toLocaleDateString("pt-BR")}
                    </p>

                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 mb-8">
                        <div className="flex items-start gap-3">
                            <Shield className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Compromisso com sua Privacidade</h3>
                                <p className="text-sm">
                                    Esta Política de Privacidade está em conformidade com a Lei Geral de Proteção de
                                    Dados (LGPD - Lei nº 13.709/2018) e descreve como coletamos, usamos, armazenamos
                                    e protegemos seus dados pessoais e de saúde.
                                </p>
                            </div>
                        </div>
                    </div>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                            <Database className="w-6 h-6 text-primary" />
                            1. Dados que Coletamos
                        </h2>

                        <h3 className="text-xl font-semibold mb-3">1.1 Dados Pessoais</h3>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li>Nome completo</li>
                            <li>Endereço de e-mail</li>
                            <li>Data de nascimento</li>
                            <li>Informações de autenticação (senha criptografada)</li>
                        </ul>

                        <h3 className="text-xl font-semibold mb-3">1.2 Dados de Saúde (Sensíveis)</h3>
                        <p className="mb-2">
                            <strong className="text-orange-600 dark:text-orange-400">
                                ⚠️ Dados Sensíveis conforme LGPD Art. 5º, II
                            </strong>
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li>Medições de glicemia (valores, datas e horários)</li>
                            <li>Informações sobre refeições e alimentos consumidos</li>
                            <li>Medicações e dosagens</li>
                            <li>Informações sobre médicos e consultas</li>
                            <li>Dados de atividades físicas</li>
                            <li>Observações e notas pessoais sobre saúde</li>
                        </ul>

                        <h3 className="text-xl font-semibold mb-3">1.3 Dados Técnicos</h3>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Endereço IP</li>
                            <li>Tipo de navegador e dispositivo</li>
                            <li>Data e hora de acesso</li>
                            <li>Páginas visitadas</li>
                        </ul>
                    </section>

                    <section className="mb-8" id="data-processing">
                        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                            <Eye className="w-6 h-6 text-primary" />
                            2. Como Usamos seus Dados
                        </h2>

                        <h3 className="text-xl font-semibold mb-3">2.1 Finalidades do Tratamento</h3>
                        <p className="mb-2"><strong>Base Legal:</strong> Consentimento (LGPD Art. 7º, I)</p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li>
                                <strong>Funcionalidade do Sistema:</strong> Processar e exibir seus dados de
                                glicemia, refeições e medicações
                            </li>
                            <li>
                                <strong>Análises e Estatísticas:</strong> Calcular médias, tendências e
                                variabilidade glicêmica
                            </li>
                            <li>
                                <strong>Predições:</strong> Gerar previsões de impacto glicêmico baseadas em
                                histórico
                            </li>
                            <li>
                                <strong>Relatórios:</strong> Criar relatórios médicos para compartilhamento com
                                profissionais de saúde
                            </li>
                            <li>
                                <strong>Melhorias:</strong> Aprimorar funcionalidades e experiência do usuário
                            </li>
                        </ul>

                        <h3 className="text-xl font-semibold mb-3">2.2 Não Compartilhamento</h3>
                        <p className="font-semibold text-green-600 dark:text-green-400 mb-2">
                            ✓ Seus dados de saúde NÃO são compartilhados com terceiros
                        </p>
                        <p>
                            Não vendemos, alugamos ou compartilhamos seus dados pessoais ou de saúde com
                            terceiros para fins comerciais ou de marketing.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                            <Lock className="w-6 h-6 text-primary" />
                            3. Segurança e Armazenamento
                        </h2>

                        <h3 className="text-xl font-semibold mb-3">3.1 Medidas de Segurança</h3>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li>
                                <strong>Criptografia:</strong> Todos os dados são transmitidos via HTTPS (TLS/SSL)
                            </li>
                            <li>
                                <strong>Senhas:</strong> Armazenadas com hash bcrypt (não reversível)
                            </li>
                            <li>
                                <strong>Banco de Dados:</strong> Hospedado em servidores seguros (Supabase) com
                                backup automático
                            </li>
                            <li>
                                <strong>Acesso Restrito:</strong> Row Level Security (RLS) - você só acessa seus
                                próprios dados
                            </li>
                            <li>
                                <strong>Auditoria:</strong> Logs de todas as operações em dados sensíveis
                            </li>
                        </ul>

                        <h3 className="text-xl font-semibold mb-3">3.2 Localização dos Dados</h3>
                        <p>
                            Seus dados são armazenados em servidores localizados em datacenters certificados,
                            com conformidade às normas internacionais de segurança (ISO 27001, SOC 2).
                        </p>

                        <h3 className="text-xl font-semibold mb-3 mt-4">3.3 Período de Retenção</h3>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>
                                <strong>Dados Ativos:</strong> Mantidos enquanto sua conta estiver ativa
                            </li>
                            <li>
                                <strong>Após Exclusão:</strong> Dados são permanentemente removidos em até 30 dias
                            </li>
                            <li>
                                <strong>Logs de Auditoria:</strong> Mantidos de forma anonimizada por 5 anos para
                                compliance legal
                            </li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">4. Seus Direitos (LGPD Art. 18)</h2>

                        <div className="space-y-4">
                            <div className="border-l-4 border-primary pl-4">
                                <h3 className="text-lg font-semibold mb-2">
                                    <Download className="w-5 h-5 inline mr-2" />
                                    Direito à Portabilidade
                                </h3>
                                <p>
                                    Você pode exportar todos os seus dados em formato JSON a qualquer momento através
                                    das configurações do sistema.
                                </p>
                            </div>

                            <div className="border-l-4 border-primary pl-4">
                                <h3 className="text-lg font-semibold mb-2">
                                    <UserX className="w-5 h-5 inline mr-2" />
                                    Direito ao Esquecimento
                                </h3>
                                <p>
                                    Você pode solicitar a exclusão permanente de todos os seus dados através da opção
                                    "Excluir Minha Conta" nas configurações.
                                </p>
                            </div>

                            <div className="border-l-4 border-primary pl-4">
                                <h3 className="text-lg font-semibold mb-2">Outros Direitos</h3>
                                <ul className="list-disc pl-6 space-y-1">
                                    <li>Confirmação da existência de tratamento</li>
                                    <li>Acesso aos dados</li>
                                    <li>Correção de dados incompletos, inexatos ou desatualizados</li>
                                    <li>Anonimização, bloqueio ou eliminação de dados desnecessários</li>
                                    <li>Revogação do consentimento</li>
                                    <li>Informação sobre compartilhamento (não aplicável - não compartilhamos)</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section className="mb-8" id="marketing">
                        <h2 className="text-2xl font-semibold mb-4">5. Comunicações e Marketing</h2>
                        <p className="mb-4">
                            <strong>Base Legal:</strong> Consentimento específico (LGPD Art. 7º, I)
                        </p>
                        <p>
                            Podemos enviar comunicações sobre:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li>Atualizações importantes do sistema</li>
                            <li>Novas funcionalidades</li>
                            <li>Dicas de uso</li>
                            <li>Alterações nos Termos ou Política de Privacidade</li>
                        </ul>
                        <p>
                            Você pode optar por não receber comunicações não essenciais a qualquer momento através
                            das configurações de consentimento.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">6. Cookies e Tecnologias Similares</h2>
                        <p className="mb-4">Utilizamos cookies essenciais para:</p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li>Manter sua sessão autenticada</li>
                            <li>Lembrar suas preferências (tema escuro/claro)</li>
                            <li>Garantir a segurança do sistema</li>
                        </ul>
                        <p>
                            <strong>Não utilizamos cookies de rastreamento ou publicidade.</strong>
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">7. Menores de Idade</h2>
                        <p>
                            O sistema pode ser usado por menores de 18 anos sob supervisão de pais ou
                            responsáveis legais. O consentimento para tratamento de dados de menores deve ser
                            fornecido pelos responsáveis legais.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">8. Alterações nesta Política</h2>
                        <p>
                            Podemos atualizar esta Política de Privacidade periodicamente. Alterações
                            significativas serão notificadas por e-mail ou através de aviso no sistema. A data da
                            última atualização está sempre indicada no topo desta página.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">9. Encarregado de Dados (DPO)</h2>
                        <p className="mb-4">
                            Para exercer seus direitos ou esclarecer dúvidas sobre o tratamento de seus dados,
                            entre em contato com nosso Encarregado de Proteção de Dados:
                        </p>
                        <div className="bg-muted p-4 rounded-lg">
                            <p className="text-sm">
                                <strong>E-mail:</strong> dpo@controleglicemia.com.br
                                <br />
                                <strong>Prazo de Resposta:</strong> Até 15 dias úteis
                            </p>
                        </div>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">10. Autoridade Nacional</h2>
                        <p>
                            Você também pode registrar reclamações junto à Autoridade Nacional de Proteção de
                            Dados (ANPD):
                        </p>
                        <div className="bg-muted p-4 rounded-lg mt-4">
                            <p className="text-sm">
                                <strong>Site:</strong>{" "}
                                <a
                                    href="https://www.gov.br/anpd"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                >
                                    www.gov.br/anpd
                                </a>
                            </p>
                        </div>
                    </section>

                    <div className="mt-12 p-6 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">
                            Esta Política de Privacidade foi elaborada em conformidade com a Lei Geral de
                            Proteção de Dados (Lei nº 13.709/2018) e reflete nosso compromisso com a proteção
                            de seus dados pessoais e de saúde.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
