import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { NovoRegistroForm } from "@/components/novo-registro-form"

export default async function NovoRegistroPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <NovoRegistroForm userId={data.user.id} />
      </div>
    </div>
  )
}
