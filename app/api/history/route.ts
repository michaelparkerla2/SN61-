import { NextRequest, NextResponse } from "next/server"
import { redis, SNAPPY_PREFIX } from "@/lib/redis"

// GET /api/history?limit=50 - Get recent memory history (timeline)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    // Get from history list
    const history = await redis.lrange(`${SNAPPY_PREFIX}history`, offset, offset + limit - 1)

    const parsed = history.map((item) => {
      return typeof item === "string" ? JSON.parse(item) : item
    })

    // Get total count
    const total = await redis.llen(`${SNAPPY_PREFIX}history`)

    return NextResponse.json({
      history: parsed,
      count: parsed.length,
      total,
      offset,
      limit,
    })
  } catch (error) {
    console.error("History error:", error)
    return NextResponse.json(
      { error: "Failed to retrieve history" },
      { status: 500 }
    )
  }
}

// DELETE /api/history - Clear all history (use with caution)
export async function DELETE() {
  try {
    // Get all SNappY keys
    const keys = await redis.keys(`${SNAPPY_PREFIX}*`)
    
    if (keys.length > 0) {
      await redis.del(...keys)
    }

    return NextResponse.json({
      status: "cleared",
      deletedKeys: keys.length,
    })
  } catch (error) {
    console.error("Clear error:", error)
    return NextResponse.json(
      { error: "Failed to clear history" },
      { status: 500 }
    )
  }
}
