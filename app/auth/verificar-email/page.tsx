import { Activity } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function VerificarEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-teal-600 rounded-xl p-3">
              <Activity className="w-6 h-6 text-white" />
            </div>
          </div>

          <h1 className="text-2xl font-bold mb-2">Verifique seu email</h1>
          <p className="text-gray-500 mb-6">
            Enviamos um link de confirmação para seu email. Por favor, clique no link para ativar sua conta.
          </p>

          <Link href="/auth/login">
            <Button className="w-full bg-teal-600 hover:bg-teal-700">Voltar para login</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
