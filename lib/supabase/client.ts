import { createBrowserClient } from "@supabase/ssr"

let client: ReturnType<typeof createBrowserClient> | undefined

export function createClient() {
  if (client) return client

  // console.log("[v0] Creating Supabase client...") // Reduced logging to avoid noise

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // console.log("[v0] Supabase URL exists:", !!supabaseUrl)

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[v0] Missing Supabase environment variables!")
    throw new Error("Missing Supabase environment variables. Please check your configuration.")
  }

  client = createBrowserClient(supabaseUrl, supabaseAnonKey)
  return client
}
