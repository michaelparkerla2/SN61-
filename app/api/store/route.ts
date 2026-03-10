import { NextRequest, NextResponse } from "next/server"
import { redis, SNAPPY_PREFIX, type MemoryLog } from "@/lib/redis"

// POST /api/store - Store a memory log
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { key, value } = body as { key: string; value: MemoryLog | Record<string, unknown> }

    if (!key || !value) {
      return NextResponse.json(
        { error: "Missing key or value" },
        { status: 400 }
      )
    }

    // Add timestamp if not present
    const logEntry = {
      ...value,
      timestamp: value.timestamp || new Date().toISOString(),
      id: value.id || `${key}_${Date.now()}`,
    }

    // Store with SNappY prefix
    const fullKey = key.startsWith(SNAPPY_PREFIX) ? key : `${SNAPPY_PREFIX}${key}`
    await redis.set(fullKey, JSON.stringify(logEntry))

    // Also add to history list for timeline queries
    await redis.lpush(`${SNAPPY_PREFIX}history`, JSON.stringify({
      key: fullKey,
      ...logEntry,
    }))

    // Keep history trimmed to last 1000 entries
    await redis.ltrim(`${SNAPPY_PREFIX}history`, 0, 999)

    return NextResponse.json({
      status: "stored",
      key: fullKey,
      id: logEntry.id,
    })
  } catch (error) {
    console.error("Store error:", error)
    return NextResponse.json(
      { error: "Failed to store memory" },
      { status: 500 }
    )
  }
}
