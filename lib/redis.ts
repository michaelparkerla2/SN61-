import { Redis } from "@upstash/redis"

export const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

// Memory log types for Claw bot
export interface MemoryLog {
  id: string
  timestamp: string
  type: "win" | "rejection" | "plan" | "avoid" | "submission"
  version: string
  status: "pending" | "accepted" | "rejected"
  score?: number
  hash?: string
  signals?: string[]
  reason?: string
  fix?: string
  notes?: string
  metadata?: Record<string, unknown>
}

// Keys prefix for SNappY
export const SNAPPY_PREFIX = "snappy:"
export const MEMORY_KEY = `${SNAPPY_PREFIX}memory`
export const HISTORY_KEY = `${SNAPPY_PREFIX}history`

// Centralized keys for SNappY
export const KEYS = {
  TIMELINE: `${SNAPPY_PREFIX}timeline`,
  AVOIDS: `${SNAPPY_PREFIX}avoids`,
  WINS: `${SNAPPY_PREFIX}wins`,
  REJECTIONS: `${SNAPPY_PREFIX}rejections`,
  PLANS: `${SNAPPY_PREFIX}plans`,
  REDFEED_LAST_SYNC: `${SNAPPY_PREFIX}redfeed:last_sync`,
}

// Ridges prefix and keys
export const RIDGES_PREFIX = "ridges:"
export const RIDGES_KEYS = {
  LAST_INGEST: `${RIDGES_PREFIX}last_ingest`,
  STATS: `${RIDGES_PREFIX}stats`,
}
