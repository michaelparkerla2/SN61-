import { NextResponse } from "next/server"
import { redis, RIDGES_PREFIX } from "@/lib/redis"
import { runAnalysis, type MinerData } from "@/lib/ridges/analyzer"

/**
 * GET /api/ridges/analyze
 * Run competitive analysis on all ingested data
 */
export async function GET() {
  try {
    // Get all method entries
    const methodKeys = await redis.keys(`${RIDGES_PREFIX}method:*`)
    
    if (methodKeys.length === 0) {
      return NextResponse.json({
        error: "No data available. Run POST /api/ridges/ingest first.",
        timestamp: new Date().toISOString()
      }, { status: 404 })
    }

    // Load all miner data
    const miners: MinerData[] = []

    for (const key of methodKeys) {
      const data = await redis.get<string>(key)
      if (!data) continue

      try {
        const parsed = typeof data === "string" ? JSON.parse(data) : data
        miners.push({
          uid: parsed.uid || "unknown",
          score: parsed.score || 0,
          penalty: parsed.penalty || 0,
          methodType: parsed.methodType || "unknown",
          methodDescription: parsed.methodDescription || "",
          signals: parsed.signals || [],
          status: determineStatus(parsed.score, parsed.penalty),
          scoredAt: parsed.lastUpdated,
          challenge: parsed.challenge || "unknown"
        })
      } catch {
        // Skip unparseable entries
      }
    }

    // Run analysis
    const analysis = runAnalysis(miners)

    return NextResponse.json(analysis)

  } catch (error) {
    console.error("Ridges analyze error:", error)
    return NextResponse.json(
      { error: "Failed to run analysis", details: String(error) },
      { status: 500 }
    )
  }
}

/**
 * Determine status from score and penalty
 */
function determineStatus(score: number, penalty: number): "Accepted" | "Rejected" | "Received" {
  if (score > 0 && penalty < 0.5) return "Accepted"
  if (score === 0 || penalty >= 0.5) return "Rejected"
  return "Received"
}
