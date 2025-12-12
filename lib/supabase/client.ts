import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  console.log("[v0] Creating Supabase client...")

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  console.log("[v0] Supabase URL exists:", !!supabaseUrl)
  console.log("[v0] Supabase Anon Key exists:", !!supabaseAnonKey)

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[v0] Missing Supabase environment variables!")
    console.error(
      "[v0] Available env vars:",
      Object.keys(process.env).filter((k) => k.includes("SUPABASE")),
    )
    throw new Error("Missing Supabase environment variables. Please check your configuration.")
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
