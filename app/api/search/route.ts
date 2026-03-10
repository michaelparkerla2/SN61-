import { NextRequest, NextResponse } from "next/server"
import { redis, SNAPPY_PREFIX } from "@/lib/redis"

// GET /api/search?query=fragmentation - Search memory logs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("query")?.toLowerCase()
    const type = searchParams.get("type") // filter by type: win, rejection, plan, avoid
    const limit = parseInt(searchParams.get("limit") || "50")

    if (!query && !type) {
      return NextResponse.json(
        { error: "Missing query or type parameter" },
        { status: 400 }
      )
    }

    // Get all keys with SNappY prefix
    const keys = await redis.keys(`${SNAPPY_PREFIX}*`)
    const matches: Array<{ key: string; value: Record<string, unknown> }> = []

    for (const key of keys) {
      if (key === `${SNAPPY_PREFIX}history`) continue // Skip history list

      const value = await redis.get(key)
      if (!value) continue

      const parsed = typeof value === "string" ? JSON.parse(value) : value
      const stringified = JSON.stringify(parsed).toLowerCase()

      // Match by query text
      const matchesQuery = !query || stringified.includes(query)
      
      // Match by type filter
      const matchesType = !type || parsed.type === type

      if (matchesQuery && matchesType) {
        matches.push({ key, value: parsed })
      }

      if (matches.length >= limit) break
    }

    // Sort by timestamp descending (newest first)
    matches.sort((a, b) => {
      const timeA = new Date(a.value.timestamp as string || 0).getTime()
      const timeB = new Date(b.value.timestamp as string || 0).getTime()
      return timeB - timeA
    })

    return NextResponse.json({
      matches,
      count: matches.length,
      query,
      type,
    })
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json(
      { error: "Failed to search memory" },
      { status: 500 }
    )
  }
}
