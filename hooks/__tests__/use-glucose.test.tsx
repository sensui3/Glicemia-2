import { renderHook, waitFor } from "@testing-library/react"
import { useAddGlucoseReading } from "../use-glucose-unified"
import { vi, describe, it, expect, beforeEach } from "vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import React from "react"

// Mock Supabase Chain
const mockOrder = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockGte = vi.fn()
const mockLte = vi.fn()
const mockInsert = vi.fn()
const mockSingle = vi.fn()

// Chain implementations
const mockQueryBuilder = {
    select: mockSelect,
    eq: mockEq,
    gte: mockGte,
    lte: mockLte,
    order: mockOrder,
    ilike: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    insert: mockInsert,
    single: mockSingle,
}

// Recursive chaining validation
mockSelect.mockReturnValue(mockQueryBuilder)
mockEq.mockReturnValue(mockQueryBuilder)
mockGte.mockReturnValue(mockQueryBuilder)
mockLte.mockReturnValue(mockQueryBuilder)
mockOrder.mockReturnValue(mockQueryBuilder)
mockInsert.mockReturnValue(mockQueryBuilder)

vi.mock("@/lib/supabase/client", () => ({
    createClient: () => ({
        from: vi.fn(() => mockQueryBuilder)
    })
}))

// Mock Toast
vi.mock("@/components/ui/use-toast", () => ({
    toast: vi.fn()
}))

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
        },
    },
})

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
)

describe("useAddGlucoseReading", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockSingle.mockResolvedValue({ data: { id: "new-1", reading_value: 120 }, error: null })
    })

    it("adds a reading and invalidates cache", async () => {
        const { result } = renderHook(() => useAddGlucoseReading(), { wrapper })

        await result.current.mutateAsync({
            reading_value: 120,
            user_id: "user-123"
        })

        expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
            reading_value: 120,
            user_id: "user-123"
        }))
    })
})
