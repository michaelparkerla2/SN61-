import { NextResponse } from "next/server"
import { redis, RIDGES_PREFIX, RIDGES_KEYS } from "@/lib/redis"
import { 
  parseValidationOutput, 
  parseComparisonLogs, 
  parseResultJson,
  extractMethodType,
  extractMethodSummary,
  determineChallengeType
} from "@/lib/ridges/parser"
import { extractSignals } from "@/lib/ridges/keywords"

const REDFEED_API = process.env.REDFEED_URL || "https://theredfeed.vercel.app/api/redteam-data"

interface RedFeedMiner {
  "Miner UID": string
  "Image Digest"?: string
  "Status": string
  "Penalty": string | number
  "Score": string | number
  "Final Score": string | number
  "Commit Time": string
  "Scored Time": string
  "Note"?: string
  "Validation Output": string
  "Comparison Logs": string
  "Result JSON": string
  [key: string]: unknown
}

/**
 * POST /api/ridges/ingest
 * Pull fresh data from Red Feed and store structured for analysis
 */
export async function POST() {
  try {
    // Fetch Red Feed data
    const response = await fetch(REDFEED_API, {
      headers: { "Accept": "application/json" },
      next: { revalidate: 0 }
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Red Feed API returned ${response.status}` },
        { status: 502 }
      )
    }

    const rawData = await response.json()

    // Handle different response formats
    let miners: RedFeedMiner[] = []
    if (Array.isArray(rawData)) {
      miners = rawData
    } else if (rawData.miners && Array.isArray(rawData.miners)) {
      miners = rawData.miners
    } else if (rawData.data && Array.isArray(rawData.data)) {
      miners = rawData.data
    }

    if (miners.length === 0) {
      return NextResponse.json({
        error: "No miners found in Red Feed response",
        rawKeys: Object.keys(rawData)
      }, { status: 400 })
    }

    // Get last ingest time for comparison
    const lastIngest = await redis.get<string>(RIDGES_KEYS.LAST_INGEST)
    const lastIngestTime = lastIngest ? new Date(lastIngest).getTime() : 0

    let ingested = 0
    let accepted = 0
    let rejected = 0
    let received = 0
    let newSinceLastSync = 0

    // Process each miner entry
    for (const miner of miners) {
      const uid = String(miner["Miner UID"] || "unknown")
      const digest = String(miner["Image Digest"] || "")
      const digestShort = digest.substring(0, 12)
      const status = String(miner["Status"] || "").toLowerCase()
      const penalty = parseFloat(String(miner["Penalty"] || 0)) || 0
      const score = parseFloat(String(miner["Score"] || 0)) || 0
      const finalScore = parseFloat(String(miner["Final Score"] || score)) || 0
      const commitTime = miner["Commit Time"] || new Date().toISOString()
      const scoredTime = miner["Scored Time"] || ""
      const validationOutput = String(miner["Validation Output"] || "")
      const comparisonLogs = String(miner["Comparison Logs"] || "")
      const resultJson = String(miner["Result JSON"] || "")

      // Parse fields
      const parsedValidation = parseValidationOutput(validationOutput)
      const parsedComparisons = parseComparisonLogs(comparisonLogs)
      const parsedResults = parseResultJson(resultJson)
      
      // Extract method info
      const methodType = extractMethodType(parsedValidation.integrity.reason)
      const methodSummary = extractMethodSummary(parsedComparisons)
      const signals = extractSignals(methodSummary + " " + parsedValidation.integrity.reason)
      const challengeType = determineChallengeType(parsedResults)

      // Count by status
      if (status.includes("accept")) accepted++
      else if (status.includes("reject") || status.includes("invalid")) rejected++
      else received++

      // Check if new since last sync
      const entryTime = new Date(commitTime).getTime()
      if (entryTime > lastIngestTime) {
        newSinceLastSync++
      }

      // Store miner data
      const minerKey = `${RIDGES_PREFIX}miner:${uid}:${digestShort}`
      await redis.set(minerKey, JSON.stringify({
        uid,
        digest,
        status: miner["Status"],
        penalty,
        score,
        finalScore,
        commitTime,
        scoredTime,
        methodType,
        methodSummary,
        signals,
        challengeType,
        validationReason: parsedValidation.integrity.reason,
        comparisons: parsedComparisons.slice(0, 10), // Top 10 comparisons
        testResults: parsedResults.slice(0, 5), // Sample of test results
        ingestedAt: new Date().toISOString()
      }))

      // Store scored entry (if scored)
      if (scoredTime && finalScore > 0) {
        const scoredKey = `${RIDGES_PREFIX}scored:${scoredTime}:${uid}`
        await redis.set(scoredKey, JSON.stringify({
          uid,
          score: finalScore,
          penalty,
          methodType,
          methodSummary,
          signals,
          challengeType
        }))
      }

      // Store method summary for quick lookup
      const methodKey = `${RIDGES_PREFIX}method:${uid}`
      await redis.set(methodKey, JSON.stringify({
        uid,
        methodDescription: methodSummary,
        methodType,
        signals,
        score: finalScore,
        penalty,
        lastUpdated: new Date().toISOString()
      }))

      ingested++
    }

    // Update last ingest time
    const timestamp = new Date().toISOString()
    await redis.set(RIDGES_KEYS.LAST_INGEST, timestamp)

    // Update stats
    await redis.set(RIDGES_KEYS.STATS, JSON.stringify({
      lastIngest: timestamp,
      totalIngested: ingested,
      accepted,
      rejected,
      received
    }))

    return NextResponse.json({
      ingested,
      accepted,
      rejected,
      received,
      newSinceLastSync,
      timestamp
    })

  } catch (error) {
    console.error("Ridges ingest error:", error)
    return NextResponse.json(
      { error: "Failed to ingest Red Feed data", details: String(error) },
      { status: 500 }
    )
  }
}

/**
 * GET /api/ridges/ingest
 * Get ingest status
 */
export async function GET() {
  try {
    const lastIngest = await redis.get<string>(RIDGES_KEYS.LAST_INGEST)
    const stats = await redis.get<string>(RIDGES_KEYS.STATS)

    return NextResponse.json({
      lastIngest,
      stats: stats ? JSON.parse(stats) : null,
      endpoint: REDFEED_API,
      description: "POST to ingest fresh data from Red Feed"
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get ingest status", details: String(error) },
      { status: 500 }
    )
  }
}
