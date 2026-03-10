import { NextResponse } from "next/server"
import { redis, RIDGES_PREFIX } from "@/lib/redis"

interface LeaderboardEntry {
  rank: number
  uid: string
  score: number
  penalty: number
  challenge: string
  methodType: string
  methodSummary: string
  scoredAt: string
}

interface LeaderboardStats {
  totalScored: number
  accepted: number
  rejected: number
  avgAcceptedScore: number
  avgPenalty: number
}

/**
 * GET /api/ridges/leaderboard
 * Show ranked view of all scored miners
 */
export async function GET() {
  try {
    // Get all miner entries
    const minerKeys = await redis.keys(`${RIDGES_PREFIX}miner:*`)
    
    if (minerKeys.length === 0) {
      return NextResponse.json({
        error: "No data available. Run POST /api/ridges/ingest first.",
        lastUpdated: new Date().toISOString()
      }, { status: 404 })
    }

    interface MinerEntry {
      uid: string
      score: number
      penalty: number
      challenge: string
      methodType: string
      methodSummary: string
      scoredTime: string
      status: string
    }

    const entries: MinerEntry[] = []
    let totalScored = 0
    let accepted = 0
    let rejected = 0
    let totalPenalty = 0
    let acceptedScoreSum = 0

    for (const key of minerKeys) {
      const data = await redis.get<string>(key)
      if (!data) continue

      try {
        const parsed = typeof data === "string" ? JSON.parse(data) : data
        
        const score = parsed.finalScore || parsed.score || 0
        const penalty = parsed.penalty || 0
        const status = String(parsed.status || "").toLowerCase()

        if (score > 0) {
          totalScored++
          totalPenalty += penalty

          if (status.includes("accept")) {
            accepted++
            acceptedScoreSum += score
          } else if (status.includes("reject") || status.includes("invalid")) {
            rejected++
          }

          entries.push({
            uid: parsed.uid || "unknown",
            score,
            penalty,
            challenge: parsed.challengeType || "unknown",
            methodType: parsed.methodType || "unknown",
            methodSummary: parsed.methodSummary || "unknown method",
            scoredTime: parsed.scoredTime || parsed.commitTime || "",
            status
          })
        }
      } catch {
        // Skip unparseable entries
      }
    }

    // Sort by score descending
    entries.sort((a, b) => b.score - a.score)

    // Build leaderboard
    const leaderboard: LeaderboardEntry[] = entries.map((entry, index) => ({
      rank: index + 1,
      uid: entry.uid,
      score: entry.score,
      penalty: entry.penalty,
      challenge: entry.challenge,
      methodType: entry.methodType,
      methodSummary: entry.methodSummary.substring(0, 100),
      scoredAt: entry.scoredTime
    }))

    const stats: LeaderboardStats = {
      totalScored,
      accepted,
      rejected,
      avgAcceptedScore: accepted > 0 ? Math.round((acceptedScoreSum / accepted) * 100) / 100 : 0,
      avgPenalty: totalScored > 0 ? Math.round((totalPenalty / totalScored) * 100) / 100 : 0
    }

    return NextResponse.json({
      lastUpdated: new Date().toISOString(),
      leaderboard: leaderboard.slice(0, 50), // Top 50
      stats
    })

  } catch (error) {
    console.error("Ridges leaderboard error:", error)
    return NextResponse.json(
      { error: "Failed to get leaderboard", details: String(error) },
      { status: 500 }
    )
  }
}
