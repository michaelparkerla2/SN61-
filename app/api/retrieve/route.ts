import { NextRequest, NextResponse } from "next/server"
import { redis, SNAPPY_PREFIX } from "@/lib/redis"

// GET /api/retrieve?key=dfp_v7 - Retrieve a memory log
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get("key")

    if (!key) {
      return NextResponse.json(
        { error: "Missing key parameter" },
        { status: 400 }
      )
    }

    // Add prefix if not present
    const fullKey = key.startsWith(SNAPPY_PREFIX) ? key : `${SNAPPY_PREFIX}${key}`
    const value = await redis.get(fullKey)

    if (!value) {
      return NextResponse.json({ value: null, found: false })
    }

    // Parse if string
    const parsed = typeof value === "string" ? JSON.parse(value) : value

    return NextResponse.json({
      value: parsed,
      found: true,
      key: fullKey,
    })
  } catch (error) {
    console.error("Retrieve error:", error)
    return NextResponse.json(
      { error: "Failed to retrieve memory" },
      { status: 500 }
    )
  }
}
