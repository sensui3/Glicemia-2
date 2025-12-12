import { createClient } from "@/lib/supabase/server"
import { MedicacoesContent } from "@/components/medicacoes-content"

export default async function MedicacoesPage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()

  return <MedicacoesContent userId={data.user!.id} />
}
