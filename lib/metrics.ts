
import { GlucoseReading, GlucoseLimits } from "./types"
import { differenceInMinutes, parseISO } from "date-fns"

export type VariabilityMetrics = {
    average: number
    stdDev: number
    cv: number // Coefficient of Variation %
    min: number
    max: number
    mage?: number // Mean Amplitude of Glycemic Excursions (complex to calculate exactly without continuous data, but we can approximate)
    gmi: number // Glucose Management Indicator (estimated A1c)
}

export type ActivityCorrelation = {
    activityType: string
    count: number
    avgGlucoseBefore: number
    avgGlucoseAfter: number
    impact: number // Difference
}

export function calculateStats(readings: GlucoseReading[]): VariabilityMetrics {
    if (readings.length === 0) {
        return { average: 0, stdDev: 0, cv: 0, min: 0, max: 0, gmi: 0 }
    }

    const values = readings.map((r) => r.reading_value)
    const sum = values.reduce((a, b) => a + b, 0)
    const average = sum / values.length

    const squareDiffs = values.map((value) => {
        const diff = value - average
        return diff * diff
    })

    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length
    const stdDev = Math.sqrt(avgSquareDiff)
    const cv = (stdDev / average) * 100

    const min = Math.min(...values)
    const max = Math.max(...values)

    // GMI Formula: 3.31 + 0.02392 * mean_glucose_mg/dl
    const gmi = 3.31 + 0.02392 * average

    return {
        average: Math.round(average),
        stdDev: Number(stdDev.toFixed(1)),
        cv: Number(cv.toFixed(1)),
        min,
        max,
        gmi: Number(gmi.toFixed(1)),
    }
}

export function analyzeActivityImpact(readings: GlucoseReading[]): ActivityCorrelation[] {
    // Filter readings that are related to activity
    // This requires identifying pairs or single readings marked with activity
    // Since we store activity info IN the reading, we can look at "activity_moment"

    // Strategy: 
    // 1. Group by activity type
    // 2. If moment is 'antes', it's a baseline. We need to find the NEXT reading to see impact? 
    //    Or if moment is 'apos', we compare to PREVIOUS reading?
    //    This assumes user logs twice.

    // Alternative for single log: 
    // If user logs "After", we can compare to their average? Or just report the value of "After" readings vs "No Activity" readings?

    // Let's compare: Average Glucose for readings WITH activity vs WITHOUT.
    // And specific breakdown by Type.

    const withActivity = readings.filter(r => r.activity_type && r.activity_type.trim() !== "")
    const withoutActivity = readings.filter(r => !r.activity_type)

    if (withActivity.length === 0) return []

    // Group by type
    const impacts: ActivityCorrelation[] = []
    const types = Array.from(new Set(withActivity.map(r => r.activity_type!)))

    types.forEach(type => {
        const typeReadings = withActivity.filter(r => r.activity_type === type)
        const avg = typeReadings.reduce((acc, curr) => acc + curr.reading_value, 0) / typeReadings.length

        // Compare 'After' readings specifically if available
        const afterReadings = typeReadings.filter(r => r.activity_moment === 'apos_atividade')
        const beforeReadings = typeReadings.filter(r => r.activity_moment === 'antes_medicao')

        const avgAfter = afterReadings.length > 0
            ? afterReadings.reduce((a, b) => a + b.reading_value, 0) / afterReadings.length
            : 0

        const avgBefore = beforeReadings.length > 0
            ? beforeReadings.reduce((a, b) => a + b.reading_value, 0) / beforeReadings.length
            : 0

        // If we have both, calculate drop
        let impact = 0
        if (avgBefore > 0 && avgAfter > 0) {
            impact = avgAfter - avgBefore
        }

        impacts.push({
            activityType: type,
            count: typeReadings.length,
            avgGlucoseBefore: avgBefore || avg, // Fallback to general avg
            avgGlucoseAfter: avgAfter,
            impact
        })
    })

    return impacts
}
