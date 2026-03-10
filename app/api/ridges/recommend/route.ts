import { NextResponse } from "next/server"
import { redis, RIDGES_PREFIX, KEYS } from "@/lib/redis"
import { runAnalysis, type MinerData } from "@/lib/ridges/analyzer"
import { ALL_SIGNALS, getSignalImportance } from "@/lib/ridges/keywords"

interface SignalRecommendation {
  name: string
  reason: string
}

interface Recommendation {
  approach: "behavioral_detection" | "fingerprinting"
  confidence: number
  reasoning: string
  signals: {
    must_use: SignalRecommendation[]
    should_use: SignalRecommendation[]
    avoid: SignalRecommendation[]
  }
  noveltyGuidance: string
  estimatedScore: string
}

/**
 * GET /api/ridges/recommend
 * Generate strategy recommendation for next iteration
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
          status: parsed.score > 0 && parsed.penalty < 0.5 ? "Accepted" : "Rejected",
          scoredAt: parsed.lastUpdated,
          challenge: parsed.challenge || "unknown"
        })
      } catch {
        // Skip unparseable entries
      }
    }

    // Run analysis
    const analysis = runAnalysis(miners)

    // Get stored avoid rules from SNappY
    const avoidSet = await redis.smembers(KEYS.AVOIDS) || []

    // Determine recommended approach
    const behavioral = analysis.methodGroups.behavioral_detection
    const fingerprinting = analysis.methodGroups.fingerprinting
    
    let approach: "behavioral_detection" | "fingerprinting" = "behavioral_detection"
    let confidence = 0.9
    let reasoning = ""

    if (behavioral.avgScore > fingerprinting.avgScore * 1.2) {
      approach = "behavioral_detection"
      confidence = 0.95
      reasoning = `Behavioral detection has ${(behavioral.avgScore * 100).toFixed(0)}% avg score vs ${(fingerprinting.avgScore * 100).toFixed(0)}% for fingerprinting. Acceptance rate: ${(behavioral.acceptanceRate * 100).toFixed(0)}%.`
    } else if (fingerprinting.avgScore > behavioral.avgScore * 1.2) {
      approach = "fingerprinting"
      confidence = 0.85
      reasoning = `Fingerprinting has ${(fingerprinting.avgScore * 100).toFixed(0)}% avg score vs ${(behavioral.avgScore * 100).toFixed(0)}% for behavioral. Consider this approach.`
    } else {
      reasoning = `Both approaches have similar scores. Behavioral: ${(behavioral.avgScore * 100).toFixed(0)}%, Fingerprinting: ${(fingerprinting.avgScore * 100).toFixed(0)}%. Defaulting to behavioral for lower risk.`
    }

    // Build signal recommendations
    const mustUse: SignalRecommendation[] = []
    const shouldUse: SignalRecommendation[] = []
    const avoid: SignalRecommendation[] = []

    // Analyze signal effectiveness for must_use
    const hotSignals = analysis.signalEffectiveness.filter(s => s.trend === "hot" || (s.avgScore >= 0.9 && s.sampleSize >= 2))
    for (const signal of hotSignals.slice(0, 3)) {
      mustUse.push({
        name: signal.signal,
        reason: `${(signal.avgScore * 100).toFixed(0)}% avg score in ${signal.sampleSize} scored submissions`
      })
    }

    // Add core detection signals if not already included
    const coreSignals = ["websocket_detection", "webdriver_detection"]
    for (const sig of coreSignals) {
      if (!mustUse.some(m => m.name === sig)) {
        mustUse.push({
          name: sig,
          reason: "Core bot detection signal - reliable framework separation"
        })
      }
    }

    // should_use: effective signals and open lanes
    const effectiveSignals = analysis.signalEffectiveness.filter(
      s => s.trend === "effective" && !mustUse.some(m => m.name === s.signal)
    )
    for (const signal of effectiveSignals.slice(0, 2)) {
      shouldUse.push({
        name: signal.signal,
        reason: `${(signal.avgScore * 100).toFixed(0)}% avg score - effective technique`
      })
    }

    // Add open lanes as should_use
    const openLaneSignals = ALL_SIGNALS.filter(s => {
      const usage = analysis.signalEffectiveness.find(e => e.signal === s)
      return !usage || usage.sampleSize <= 1
    }).filter(s => getSignalImportance(s) >= 0.6)

    for (const sig of openLaneSignals.slice(0, 2)) {
      if (!shouldUse.some(s => s.name === sig) && !mustUse.some(m => m.name === sig)) {
        shouldUse.push({
          name: sig,
          reason: "Open lane - no/minimal competition"
        })
      }
    }

    // avoid: from SNappY avoid rules + low performing signals
    const knownAvoids = [
      { name: "localStorage_sessionStorage", reason: "Flagged as exfiltration" },
      { name: "Date.now_Math.random_in_hash", reason: "Non-deterministic" },
      { name: "WebRTC_createOffer", reason: "Different SDP each time" },
      { name: "performance.now_values", reason: "Precision varies between runs" },
      { name: "navigator.connection.rtt", reason: "Changes every page load" }
    ]

    avoid.push(...knownAvoids)

    // Add stored avoid rules
    for (const avoidSignal of avoidSet) {
      if (!avoid.some(a => a.name === avoidSignal)) {
        avoid.push({
          name: avoidSignal,
          reason: "Previously flagged in SNappY"
        })
      }
    }

    // Add weak/risky signals
    const weakSignals = analysis.signalEffectiveness.filter(
      s => s.trend === "weak" || s.trend === "risky"
    )
    for (const signal of weakSignals.slice(0, 3)) {
      if (!avoid.some(a => a.name === signal.signal)) {
        avoid.push({
          name: signal.signal,
          reason: `Low effectiveness: ${(signal.avgScore * 100).toFixed(0)}% avg score`
        })
      }
    }

    // Generate novelty guidance
    const saturatedText = analysis.saturatedApproaches.slice(0, 3).join(", ")
    const topMiners = behavioral.miners.slice(0, 3)
    const topMinerMethods = topMiners.map(m => `UID ${m.uid} uses ${m.method.substring(0, 50)}`).join(". ")
    
    const noveltyGuidance = `Avoid saturated approaches: ${saturatedText}. ${topMinerMethods}. Differentiate by: using different event types, different scoring weights, or combining with signals nobody uses yet (${analysis.openLanes.slice(0, 2).join(", ")}).`

    // Estimate score range
    const estimatedScore = behavioral.avgScore >= 0.8 
      ? "0.7-1.0 if implemented correctly with sufficient novelty"
      : "0.5-0.8 depending on novelty and implementation quality"

    const recommendation: Recommendation = {
      approach,
      confidence,
      reasoning,
      signals: {
        must_use: mustUse.slice(0, 5),
        should_use: shouldUse.slice(0, 5),
        avoid: avoid.slice(0, 10)
      },
      noveltyGuidance,
      estimatedScore
    }

    return NextResponse.json({
      recommendation,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error("Ridges recommend error:", error)
    return NextResponse.json(
      { error: "Failed to generate recommendation", details: String(error) },
      { status: 500 }
    )
  }
}
