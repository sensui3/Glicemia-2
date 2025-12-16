"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Loader2, Plus, Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { useFoodData, FoodItem } from "@/hooks/use-food-data"

interface FoodSearchComboboxProps {
    onSelect: (food: FoodItem) => void
}

// Simple debounce hook implementation if not available
function useDebounceValue<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = React.useState<T>(value)

    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value)
        }, delay)

        return () => {
            clearTimeout(timer)
        }
    }, [value, delay])

    return debouncedValue
}

export function FoodSearchCombobox({ onSelect }: FoodSearchComboboxProps) {
    const [open, setOpen] = React.useState(false)
    const [query, setQuery] = React.useState("")
    const debouncedQuery = useDebounceValue(query, 300)
    const { searchResults, searchFoods, loading } = useFoodData()

    React.useEffect(() => {
        if (debouncedQuery.length >= 2) {
            searchFoods(debouncedQuery)
        }
    }, [debouncedQuery, searchFoods])

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                >
                    {query ? query : "Buscar alimento..."}
                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] sm:w-[400px] p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Digite o nome do alimento..."
                        value={query}
                        onValueChange={setQuery}
                    />
                    <CommandList>
                        {loading ? (
                            <div className="py-6 text-center text-sm text-muted-foreground flex justify-center items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Buscando...
                            </div>
                        ) : (
                            <>
                                <CommandEmpty>
                                    {query.length < 2 ? "Digite pelo menos 2 letras." : "Nenhum alimento encontrado."}
                                </CommandEmpty>
                                {searchResults.length > 0 && (
                                    <CommandGroup heading="Sugestões">
                                        {searchResults.map((food) => (
                                            <CommandItem
                                                key={food.id}
                                                value={food.nome}
                                                onSelect={() => {
                                                    onSelect(food)
                                                    setOpen(false)
                                                    setQuery("")
                                                }}
                                            >
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{food.nome}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {food.carboidratos_por_100g}g carbo / 100g
                                                    </span>
                                                </div>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                )}
                            </>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
