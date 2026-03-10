import { NextResponse } from "next/server"
import { redis, RIDGES_PREFIX } from "@/lib/redis"
import { parseResultJson } from "@/lib/ridges/parser"

interface FrameworkInfo {
  name: string
  instances: number
  webdriver: boolean
  websocket: boolean
  detectionRate: number
  totalTests: number
  detected: number
}

interface TestStructure {
  totalTests: number
  humanTests: number
  botTests: number
  frameworks: FrameworkInfo[]
}

/**
 * GET /api/ridges/framework-map
 * Show detection test structure based on collected Result JSON data
 */
export async function GET() {
  try {
    // Get all miner entries
    const minerKeys = await redis.keys(`${RIDGES_PREFIX}miner:*`)
    
    if (minerKeys.length === 0) {
      return NextResponse.json({
        error: "No data available. Run POST /api/ridges/ingest first.",
        timestamp: new Date().toISOString()
      }, { status: 404 })
    }

    // Aggregate framework detection data
    const frameworkStats: Map<string, {
      instances: number
      webdriver: boolean
      websocket: boolean
      totalTests: number
      detected: number
    }> = new Map()

    let totalTestsAcrossMiners = 0
    let humanTestsCount = 0

    for (const key of minerKeys) {
      const data = await redis.get<string>(key)
      if (!data) continue

      try {
        const parsed = typeof data === "string" ? JSON.parse(data) : data
        
        // Get test results from stored data
        let testResults = parsed.testResults
        
        // If testResults is a string (raw JSON), parse it
        if (typeof testResults === "string") {
          testResults = parseResultJson(testResults)
        }

        if (!Array.isArray(testResults) || testResults.length === 0) continue

        for (const test of testResults) {
          const framework = test.expected_framework || "unknown"
          
          if (framework === "human") {
            humanTestsCount++
            continue
          }

          totalTestsAcrossMiners++

          const existing = frameworkStats.get(framework) || {
            instances: 0,
            webdriver: test.webdriver ?? false,
            websocket: test.websocket ?? false,
            totalTests: 0,
            detected: 0
          }

          existing.instances++
          existing.totalTests++
          if (test.detected) {
            existing.detected++
          }
          // Update webdriver/websocket if we see them
          if (test.webdriver) existing.webdriver = true
          if (test.websocket) existing.websocket = true

          frameworkStats.set(framework, existing)
        }
      } catch {
        // Skip unparseable entries
      }
    }

    // Build framework list
    const frameworks: FrameworkInfo[] = []
    
    for (const [name, stats] of frameworkStats.entries()) {
      frameworks.push({
        name,
        instances: Math.ceil(stats.instances / Math.max(minerKeys.length, 1)), // Avg instances per miner
        webdriver: stats.webdriver,
        websocket: stats.websocket,
        detectionRate: stats.totalTests > 0 
          ? Math.round((stats.detected / stats.totalTests) * 100) / 100 
          : 0,
        totalTests: stats.totalTests,
        detected: stats.detected
      })
    }

    // Sort by detection rate ascending (hardest first)
    frameworks.sort((a, b) => a.detectionRate - b.detectionRate)

    // Identify hardest and easiest
    const hardestToDetect = frameworks
      .filter(f => f.detectionRate < 0.7)
      .slice(0, 3)
      .map(f => f.name)

    const easiestToDetect = frameworks
      .filter(f => f.detectionRate >= 0.85)
      .map(f => f.name)

    // Calculate test structure
    const uniqueFrameworks = new Set<string>()
    for (const f of frameworks) {
      uniqueFrameworks.add(f.name)
    }

    const testStructure: TestStructure = {
      totalTests: uniqueFrameworks.size * 3 + 6, // Estimate: 3 instances per framework + 6 human
      humanTests: 6, // Standard human test count
      botTests: uniqueFrameworks.size * 3,
      frameworks: frameworks.slice(0, 10) // Top 10 frameworks
    }

    // Generate insight
    let insight = ""
    if (hardestToDetect.length > 0) {
      insight = `CDP stealth frameworks (${hardestToDetect.join(", ")}) are hardest to detect. `
    }
    if (easiestToDetect.length > 0) {
      insight += `${easiestToDetect.join(", ")} are easiest to detect. `
    }
    insight += "Focus detection effort on the hard ones."

    return NextResponse.json({
      testStructure,
      hardestToDetect,
      easiestToDetect,
      insight,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error("Ridges framework-map error:", error)
    return NextResponse.json(
      { error: "Failed to get framework map", details: String(error) },
      { status: 500 }
    )
  }
}
