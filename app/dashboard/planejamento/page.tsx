import { Metadata } from "next"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CalendarDays, ChefHat, Sparkles } from "lucide-react"

export const metadata: Metadata = {
    title: "Planejamento Alimentar | Glicemia",
    description: "Planeje suas refeições para melhor controle glicêmico.",
}

export default function MealPlanningPage() {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-full">
                    <ChefHat className="w-8 h-8 text-primary" />
                </div>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Planejamento Alimentar</h2>
                    <p className="text-muted-foreground">Otimize sua dieta com base em dados reais.</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Meta Diária de Carbs</CardTitle>
                        <Sparkles className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">130g - 150g</div>
                        <p className="text-xs text-muted-foreground">Recomendado para manter TIR {">"} 80%</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Sugestões Inteligentes</CardTitle>
                    <CardDescription>Baseado no seu histórico de glicemia.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-muted/30 p-4 rounded-lg border flex gap-4 items-start">
                        <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full">
                            <CalendarDays className="w-5 h-5 text-green-700 dark:text-green-400" />
                        </div>
                        <div>
                            <h4 className="font-semibold">Café da Manhã Ideal</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                                Seus registros mostram que refeições com <strong>≤ 30g de carboidratos</strong> entre 7h e 9h resultam em glicemia pós-prandial abaixo de 140 mg/dL em 85% das vezes.
                            </p>
                        </div>
                    </div>

                    {/* Sugestões de Baixo Custo */}
                    <div className="bg-muted/30 p-4 rounded-lg border flex gap-4 items-start">
                        <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                            <Sparkles className="w-5 h-5 text-blue-700 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-semibold">Opções Econômicas (≤ 30g carb)</h4>
                            <p className="text-sm text-muted-foreground mt-1 mb-3">
                                Alternativas acessíveis que se encaixam na sua meta para o café da manhã:
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="bg-card border p-3 rounded-md text-sm shadow-sm">
                                    <div className="font-medium flex justify-between">
                                        <span>Ovos Mexidos (2 un)</span>
                                        <span className="text-green-600 font-bold">~R$ 1,20</span>
                                    </div>
                                    <div className="text-muted-foreground flex justify-between mt-1 text-xs">
                                        <span>0.6g Carbs</span>
                                        <span>Proteína pura</span>
                                    </div>
                                </div>
                                <div className="bg-card border p-3 rounded-md text-sm shadow-sm">
                                    <div className="font-medium flex justify-between">
                                        <span>Crepioca (1 ovo + 20g goma)</span>
                                        <span className="text-green-600 font-bold">~R$ 1,50</span>
                                    </div>
                                    <div className="text-muted-foreground flex justify-between mt-1 text-xs">
                                        <span>~11g Carbs</span>
                                        <span>Sacia bem</span>
                                    </div>
                                </div>
                                <div className="bg-card border p-3 rounded-md text-sm shadow-sm">
                                    <div className="font-medium flex justify-between">
                                        <span>Batata Doce Cozida (100g)</span>
                                        <span className="text-green-600 font-bold">~R$ 0,80</span>
                                    </div>
                                    <div className="text-muted-foreground flex justify-between mt-1 text-xs">
                                        <span>~18g Carbs</span>
                                        <span>Baixo IG</span>
                                    </div>
                                </div>
                                <div className="bg-card border p-3 rounded-md text-sm shadow-sm">
                                    <div className="font-medium flex justify-between">
                                        <span>Mingau de Aveia (30g + água)</span>
                                        <span className="text-green-600 font-bold">~R$ 0,90</span>
                                    </div>
                                    <div className="text-muted-foreground flex justify-between mt-1 text-xs">
                                        <span>~17g Carbs</span>
                                        <span>Rico em fibras</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="text-center py-10 text-muted-foreground">
                        <p>O módulo completo de planejamento semanal estará disponível em breve.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
