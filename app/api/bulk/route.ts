import { NextRequest, NextResponse } from "next/server"
import { redis, SNAPPY_PREFIX } from "@/lib/redis"

// POST /api/bulk - Store multiple memory logs at once
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { logs } = body as { logs: Array<{ key: string; value: Record<string, unknown> }> }

    if (!logs || !Array.isArray(logs)) {
      return NextResponse.json(
        { error: "Missing logs array" },
        { status: 400 }
      )
    }

    const results: Array<{ key: string; id: string; status: string }> = []

    for (const { key, value } of logs) {
      const logEntry = {
        ...value,
        timestamp: value.timestamp || new Date().toISOString(),
        id: value.id || `${key}_${Date.now()}`,
      }

      const fullKey = key.startsWith(SNAPPY_PREFIX) ? key : `${SNAPPY_PREFIX}${key}`
      await redis.set(fullKey, JSON.stringify(logEntry))

      await redis.lpush(`${SNAPPY_PREFIX}history`, JSON.stringify({
        key: fullKey,
        ...logEntry,
      }))

      results.push({
        key: fullKey,
        id: logEntry.id as string,
        status: "stored",
      })
    }

    // Trim history
    await redis.ltrim(`${SNAPPY_PREFIX}history`, 0, 999)

    return NextResponse.json({
      status: "bulk_stored",
      count: results.length,
      results,
    })
  } catch (error) {
    console.error("Bulk store error:", error)
    return NextResponse.json(
      { error: "Failed to bulk store" },
      { status: 500 }
    )
  }
}

// GET /api/bulk - Export all memory as JSON
export async function GET() {
  try {
    const keys = await redis.keys(`${SNAPPY_PREFIX}*`)
    const allMemory: Record<string, unknown> = {}
    
    for (const key of keys) {
      if (key === `${SNAPPY_PREFIX}history`) {
        const history = await redis.lrange(key, 0, -1)
        allMemory.history = history.map(h => typeof h === "string" ? JSON.parse(h) : h)
      } else {
        const value = await redis.get(key)
        allMemory[key] = typeof value === "string" ? JSON.parse(value) : value
      }
    }

    return NextResponse.json({
      exportedAt: new Date().toISOString(),
      keyCount: keys.length,
      memory: allMemory,
    })
  } catch (error) {
    console.error("Bulk export error:", error)
    return NextResponse.json(
      { error: "Failed to export memory" },
      { status: 500 }
    )
  }
}
