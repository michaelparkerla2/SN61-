import { NextResponse } from "next/server"
import { redis, KEYS } from "@/lib/redis"

const REDFEED_API = "https://theredfeed.vercel.app/api/redteam-data"

interface RedFeedRow {
  "Miner UID": string
  "Image Digest": string
  "Status": string
  "Penalty": string | number
  "Score": string | number
  "Final Score": string | number
  "Commit Time": string
  "Scored Time": string
  "Note": string
  "Validation Output": string
  "Comparison Logs": string
  "Result JSON": string
  [key: string]: unknown
}

interface ProcessedEntry {
  miner: string
  score: number
  penalty: number
  note: string
  validationOutput: string
  comparisonLogs: string
  resultJson: unknown
  timestamp: string
  syncedAt: string
}

interface Learning {
  type: "avoid" | "insight" | "pattern"
  signal?: string
  reason: string
  source: string
  score?: number
  penalty?: number
  extractedAt: string
}

// Extract learnings from RedFeed entries
function extractLearnings(entries: ProcessedEntry[]): Learning[] {
  const learnings: Learning[] = []
  
  for (const entry of entries) {
    const note = entry.note?.toLowerCase() || ""
    const validation = entry.validationOutput?.toLowerCase() || ""
    const penalty = entry.penalty
    const score = entry.score
    
    // High penalty = something to avoid
    if (penalty > 0.3) {
      learnings.push({
        type: "avoid",
        reason: `High penalty ${penalty}: ${entry.note || "Unknown cause"}`,
        source: `redfeed_${entry.miner}_${entry.timestamp}`,
        penalty,
        score,
        extractedAt: new Date().toISOString()
      })
    }
    
    // Look for specific signals mentioned in notes/validation
    const volatileSignals = [
      "performance.now", "date.now", "math.random", "battery", 
      "timestamp", "volatile", "non-deterministic"
    ]
    
    for (const signal of volatileSignals) {
      if (note.includes(signal) || validation.includes(signal)) {
        learnings.push({
          type: "avoid",
          signal: signal,
          reason: `Mentioned in penalty/rejection: ${entry.note}`,
          source: `redfeed_${entry.miner}_${entry.timestamp}`,
          penalty,
          score,
          extractedAt: new Date().toISOString()
        })
      }
    }
    
    // Look for fragmentation mentions
    if (note.includes("fragmentation") || validation.includes("fragmentation")) {
      learnings.push({
        type: "avoid",
        signal: "fragmentation_issue",
        reason: `Fragmentation detected: ${entry.note}`,
        source: `redfeed_${entry.miner}_${entry.timestamp}`,
        penalty,
        score,
        extractedAt: new Date().toISOString()
      })
    }
    
    // High score = pattern that works
    if (score > 0.7 && penalty < 0.1) {
      learnings.push({
        type: "pattern",
        reason: `High score ${score} with low penalty: ${entry.note || "Good submission"}`,
        source: `redfeed_${entry.miner}_${entry.timestamp}`,
        score,
        penalty,
        extractedAt: new Date().toISOString()
      })
    }
    
    // Look for collision/entropy mentions
    if (note.includes("collision") || note.includes("entropy")) {
      learnings.push({
        type: "insight",
        reason: `Collision/entropy note: ${entry.note}`,
        source: `redfeed_${entry.miner}_${entry.timestamp}`,
        score,
        penalty,
        extractedAt: new Date().toISOString()
      })
    }
  }
  
  return learnings
}

export async function GET() {
  try {
    // Get last sync time
    const lastSync = await redis.get<string>(KEYS.REDFEED_LAST_SYNC)
    
    return NextResponse.json({
      lastSync,
      endpoint: REDFEED_API,
      description: "Use POST to sync RedFeed data into SNappY memories"
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get sync status", details: String(error) },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    // Fetch RedFeed data
    const response = await fetch(REDFEED_API, {
      headers: { "Accept": "application/json" },
      next: { revalidate: 0 }
    })
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `RedFeed API returned ${response.status}` },
        { status: 502 }
      )
    }
    
    const rawData = await response.json()
    
    // Handle different response formats - RedFeed uses "miners" key
    let rows: RedFeedRow[] = []
    if (Array.isArray(rawData)) {
      rows = rawData
    } else if (rawData.miners && Array.isArray(rawData.miners)) {
      rows = rawData.miners
    } else if (rawData.data && Array.isArray(rawData.data)) {
      rows = rawData.data
    } else if (rawData.rows && Array.isArray(rawData.rows)) {
      rows = rawData.rows
    }
    
    if (rows.length === 0) {
      return NextResponse.json({
        status: "no_data",
        message: "No rows found in RedFeed response",
        rawKeys: Object.keys(rawData)
      })
    }
    
    // Process entries - map RedFeed field names
    const processed: ProcessedEntry[] = rows.map((row) => {
      let resultJson = null
      try {
        if (row["Result JSON"] && String(row["Result JSON"]).trim()) {
          resultJson = JSON.parse(String(row["Result JSON"]))
        }
      } catch {
        // Ignore JSON parse errors
      }
      
      return {
        miner: String(row["Miner UID"] || "unknown"),
        score: parseFloat(String(row["Score"] || row["Final Score"] || 0)) || 0,
        penalty: parseFloat(String(row["Penalty"] || 0)) || 0,
        note: String(row["Note"] || ""),
        validationOutput: String(row["Validation Output"] || ""),
        comparisonLogs: String(row["Comparison Logs"] || ""),
        resultJson,
        timestamp: String(row["Commit Time"] || row["Scored Time"] || new Date().toISOString()),
        syncedAt: new Date().toISOString()
      }
    })
    
    // Extract learnings
    const learnings = extractLearnings(processed)
    
    // Store raw RedFeed data
    const syncKey = `redfeed_sync_${Date.now()}`
    await redis.set(syncKey, {
      syncedAt: new Date().toISOString(),
      rowCount: processed.length,
      entries: processed.slice(0, 100) // Store latest 100
    })
    
    // Add to timeline
    await redis.lpush(KEYS.TIMELINE, syncKey)
    await redis.ltrim(KEYS.TIMELINE, 0, 499)
    
    // Store learnings as individual memories
    let avoidsAdded = 0
    let insightsAdded = 0
    
    for (const learning of learnings) {
      const learnKey = `redfeed_learning_${learning.type}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      await redis.set(learnKey, learning)
      
      // If it's an avoid with a signal, add to avoid list
      if (learning.type === "avoid" && learning.signal) {
        const existingAvoids = await redis.smembers(KEYS.AVOIDS) || []
        if (!existingAvoids.includes(learning.signal)) {
          await redis.sadd(KEYS.AVOIDS, learning.signal)
          avoidsAdded++
        }
      }
      
      if (learning.type === "insight" || learning.type === "pattern") {
        insightsAdded++
      }
    }
    
    // Update last sync time
    await redis.set(KEYS.REDFEED_LAST_SYNC, new Date().toISOString())
    
    // Update stats
    await redis.incrby("snappy:stats:redfeed_syncs", 1)
    await redis.incrby("snappy:stats:redfeed_rows_processed", processed.length)
    
    return NextResponse.json({
      status: "synced",
      syncedAt: new Date().toISOString(),
      rowsProcessed: processed.length,
      learningsExtracted: learnings.length,
      avoidsAdded,
      insightsAdded,
      summary: {
        highPenaltyEntries: processed.filter(e => e.penalty > 0.3).length,
        highScoreEntries: processed.filter(e => e.score > 0.7).length,
        uniqueMiners: [...new Set(processed.map(e => e.miner))].length
      }
    })
    
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to sync RedFeed", details: String(error) },
      { status: 500 }
    )
  }
}
