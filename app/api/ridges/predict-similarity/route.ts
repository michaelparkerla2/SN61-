import { NextRequest, NextResponse } from "next/server"
import { redis, RIDGES_PREFIX } from "@/lib/redis"
import { extractSignals } from "@/lib/ridges/keywords"
import { predictSimilarity, isSafeToSubmit, generateGuidance } from "@/lib/ridges/similarity"

interface PredictionInput {
  description: string
  signals?: string[]
}

interface MinerPrediction {
  uid: string
  score: number
  predictedSimilarity: number
  risk: "low" | "medium" | "high"
  reason: string
}

/**
 * POST /api/ridges/predict-similarity
 * Predict similarity to known miners before submission
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as PredictionInput

    if (!body.description) {
      return NextResponse.json(
        { error: "Missing description field" },
        { status: 400 }
      )
    }

    // Extract signals from description if not provided
    const ourSignals = body.signals && body.signals.length > 0 
      ? body.signals 
      : extractSignals(body.description)

    // Get all method entries
    const methodKeys = await redis.keys(`${RIDGES_PREFIX}method:*`)
    
    if (methodKeys.length === 0) {
      return NextResponse.json({
        error: "No miner data available. Run POST /api/ridges/ingest first.",
        predictions: [],
        maxSimilarity: 0,
        safeToSubmit: true,
        guidance: "No comparison data available - proceed with caution"
      })
    }

    const predictions: MinerPrediction[] = []

    // Compare against each known miner
    for (const key of methodKeys) {
      const data = await redis.get<string>(key)
      if (!data) continue

      try {
        const parsed = typeof data === "string" ? JSON.parse(data) : data
        
        // Skip miners with no score or method
        if (!parsed.score || parsed.score === 0) continue
        if (!parsed.methodDescription) continue

        const theirSignals = parsed.signals || extractSignals(parsed.methodDescription)
        
        const result = predictSimilarity(
          ourSignals,
          body.description,
          theirSignals,
          parsed.methodDescription
        )

        predictions.push({
          uid: parsed.uid,
          score: parsed.score,
          predictedSimilarity: result.predictedSimilarity,
          risk: result.risk,
          reason: result.reason
        })
      } catch {
        // Skip unparseable entries
      }
    }

    // Sort by score descending (compare against top scorers first)
    predictions.sort((a, b) => b.score - a.score)

    // Find max similarity
    const maxSimilarity = predictions.length > 0
      ? Math.max(...predictions.map(p => p.predictedSimilarity))
      : 0

    const highestMatch = predictions.find(p => p.predictedSimilarity === maxSimilarity)
    const safeToSubmit = isSafeToSubmit(maxSimilarity)
    const guidance = generateGuidance(
      maxSimilarity, 
      highestMatch?.uid || "unknown"
    )

    return NextResponse.json({
      predictions: predictions.slice(0, 15), // Return top 15 comparisons
      maxSimilarity,
      safeToSubmit,
      guidance,
      ourSignals,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error("Ridges predict-similarity error:", error)
    return NextResponse.json(
      { error: "Failed to predict similarity", details: String(error) },
      { status: 500 }
    )
  }
}
