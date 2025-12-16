import { Metadata } from "next"
import { FoodManagementContent } from "@/components/food-management-content"

export const metadata: Metadata = {
    title: "Banco de Alimentos | Glicemia",
    description: "Gerencie seus alimentos e informações nutricionais.",
}

export default function FoodManagementPage() {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <FoodManagementContent />
        </div>
    )
}
