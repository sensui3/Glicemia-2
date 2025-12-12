import { createClient } from "@/lib/supabase/server"
import { DashboardContent } from "@/components/dashboard-content"

type SearchParams = Promise<{
  page?: string
  filter?: string
  start_date?: string
  end_date?: string
}>

export default async function DashboardPage(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams
  const page = Number.parseInt(searchParams.page || "1")
  const filter = searchParams.filter || "7days"
  const customStartDate = searchParams.start_date
  const customEndDate = searchParams.end_date

  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()

  return (
    <DashboardContent
      userId={data.user!.id}
      initialFilter={filter}
      initialPage={page}
      customStartDate={customStartDate}
      customEndDate={customEndDate}
    />
  )
}
