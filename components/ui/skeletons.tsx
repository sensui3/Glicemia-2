import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function ChartSkeleton() {
    return (
        <Card className="col-span-1 shadow-md border-muted h-[450px]">
            <CardHeader>
                <CardTitle>
                    <Skeleton className="h-6 w-48" />
                </CardTitle>
                <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full mt-4 flex items-end gap-2">
                    <Skeleton className="h-full w-full rounded-md" />
                </div>
            </CardContent>
        </Card>
    )
}

export function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-32 rounded-xl" />
                ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ChartSkeleton />
                <ChartSkeleton />
            </div>
        </div>
    )
}
