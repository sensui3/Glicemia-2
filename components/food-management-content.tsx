"use client"

import { useState } from "react"
import { useFoodData, FoodItem } from "@/hooks/use-food-data"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, Apple, Wheat, Beef, Milk, Carrot, Coffee } from "lucide-react"

const CATEGORIES = [
    "Cereais/Grãos",
    "Leguminosas",
    "Panificados",
    "Vegetais",
    "Frutas",
    "Proteínas/Lácteos",
    "Açúcares/Doces",
    "Bebidas",
    "Outros"
]

export function FoodManagementContent() {
    const { searchResults, searchFoods, createCustomFood, loading } = useFoodData()
    const [searchQuery, setSearchQuery] = useState("")

    // New Food Form State
    const [newFood, setNewFood] = useState({
        nome: "",
        categoria: "",
        carboidratos_por_100g: "",
        calories_kCal: "",
        fiber_g: "",
        protein_g: "",
        fat_g: "",
    })

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const q = e.target.value
        setSearchQuery(q)
        if (q.length >= 2) {
            searchFoods(q)
        }
    }

    const handleCreate = async () => {
        if (!newFood.nome || !newFood.categoria || !newFood.carboidratos_por_100g) return

        const foodData = {
            nome: newFood.nome,
            categoria: newFood.categoria,
            carboidratos_por_100g: Number(newFood.carboidratos_por_100g),
            calories_kCal: newFood.calories_kCal ? Number(newFood.calories_kCal) : undefined,
            fiber_g: newFood.fiber_g ? Number(newFood.fiber_g) : undefined,
            protein_g: newFood.protein_g ? Number(newFood.protein_g) : undefined,
            fat_g: newFood.fat_g ? Number(newFood.fat_g) : undefined,
        }

        const result = await createCustomFood(foodData)
        if (result) {
            setNewFood({
                nome: "",
                categoria: "",
                carboidratos_por_100g: "",
                calories_kCal: "",
                fiber_g: "",
                protein_g: "",
                fat_g: "",
            })
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-full">
                    <Apple className="w-8 h-8 text-primary" />
                </div>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Banco de Alimentos</h2>
                    <p className="text-muted-foreground">Gerencie seus alimentos e informações nutricionais.</p>
                </div>
            </div>

            <Tabs defaultValue="search" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="search">Buscar Alimentos</TabsTrigger>
                    <TabsTrigger value="new">Adicionar Novo</TabsTrigger>
                </TabsList>

                <TabsContent value="search" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Buscar na Base de Dados</CardTitle>
                            <CardDescription>
                                Pesquise por nome em nossa base brasileira e seus alimentos personalizados.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Digite o nome do alimento..."
                                    value={searchQuery}
                                    onChange={handleSearch}
                                    className="pl-9"
                                />
                            </div>

                            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                                {searchResults.map((food) => (
                                    <div key={food.id} className="border rounded-lg p-4 bg-card hover:bg-muted/50 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-semibold">{food.nome}</span>
                                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">{food.categoria}</span>
                                        </div>
                                        <div className="text-sm text-muted-foreground space-y-1">
                                            <p>Carboidratos: <span className="font-medium text-foreground">{food.carboidratos_por_100g}g</span> <span className="text-xs">/100g</span></p>
                                            {food.calories_kCal && <p>Calorias: {food.calories_kCal} kcal</p>}
                                        </div>
                                    </div>
                                ))}
                                {searchQuery.length > 2 && searchResults.length === 0 && (
                                    <div className="col-span-full text-center py-8 text-muted-foreground">
                                        Nenhum alimento encontrado.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="new" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Novo Alimento Personalizado</CardTitle>
                            <CardDescription>
                                Adicione um alimento que não está na base. Ele ficará visível apenas para você.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Nome do Alimento *</Label>
                                    <Input
                                        value={newFood.nome}
                                        onChange={(e) => setNewFood({ ...newFood, nome: e.target.value })}
                                        placeholder="Ex: Bolo de Cenoura da Vovó"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Categoria *</Label>
                                    <Select
                                        value={newFood.categoria}
                                        onValueChange={(v) => setNewFood({ ...newFood, categoria: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CATEGORIES.map(c => (
                                                <SelectItem key={c} value={c}>{c}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label>Carboidratos (g) *</Label>
                                    <Input
                                        type="number"
                                        value={newFood.carboidratos_por_100g}
                                        onChange={(e) => setNewFood({ ...newFood, carboidratos_por_100g: e.target.value })}
                                        placeholder="Por 100g"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Calorias (kcal)</Label>
                                    <Input
                                        type="number"
                                        value={newFood.calories_kCal}
                                        onChange={(e) => setNewFood({ ...newFood, calories_kCal: e.target.value })}
                                        placeholder="Opcional"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Proteínas (g)</Label>
                                    <Input
                                        type="number"
                                        value={newFood.protein_g}
                                        onChange={(e) => setNewFood({ ...newFood, protein_g: e.target.value })}
                                        placeholder="Opcional"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Fibras (g)</Label>
                                    <Input
                                        type="number"
                                        value={newFood.fiber_g}
                                        onChange={(e) => setNewFood({ ...newFood, fiber_g: e.target.value })}
                                        placeholder="Opcional"
                                    />
                                </div>
                            </div>

                            <Button onClick={handleCreate} disabled={loading} className="w-full mt-4">
                                {loading ? "Salvando..." : "Salvar Alimento"}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
