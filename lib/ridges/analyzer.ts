/**
 * Ridges Analyzer - Analysis logic for competitive intelligence
 */

import { extractSignals, getSignalTrend, OPEN_LANE_SIGNALS } from "./keywords"

export interface MinerData {
  uid: string
  score: number
  penalty: number
  methodType: "behavioral_detection" | "fingerprinting" | "unknown"
  methodDescription: string
  signals: string[]
  status: "Accepted" | "Rejected" | "Received" | "Invalid"
  scoredAt?: string
  challenge?: "ada" | "dfp" | "unknown"
}

export interface MethodGroup {
  count: number
  avgScore: number
  medianScore: number
  topScore: number
  acceptanceRate: number
  miners: Array<{
    uid: string
    score: number
    method: string
  }>
}

export interface SignalEffectiveness {
  signal: string
  avgScore: number
  sampleSize: number
  trend: "hot" | "effective" | "saturated" | "risky" | "weak"
}

export interface AnalysisResult {
  timestamp: string
  methodGroups: {
    behavioral_detection: MethodGroup
    fingerprinting: MethodGroup
    unknown: MethodGroup
  }
  signalEffectiveness: SignalEffectiveness[]
  saturatedApproaches: string[]
  openLanes: string[]
  topInsight: string
}

/**
 * Calculate median of an array of numbers
 */
function median(numbers: number[]): number {
  if (numbers.length === 0) return 0
  const sorted = [...numbers].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 
    ? sorted[mid] 
    : (sorted[mid - 1] + sorted[mid]) / 2
}

/**
 * Group miners by method type and calculate statistics
 */
export function groupByMethodType(miners: MinerData[]): AnalysisResult["methodGroups"] {
  const groups: AnalysisResult["methodGroups"] = {
    behavioral_detection: createEmptyGroup(),
    fingerprinting: createEmptyGroup(),
    unknown: createEmptyGroup()
  }

  for (const miner of miners) {
    const group = groups[miner.methodType]
    group.miners.push({
      uid: miner.uid,
      score: miner.score,
      method: miner.methodDescription.substring(0, 80)
    })
  }

  // Calculate stats for each group
  for (const [type, group] of Object.entries(groups) as [keyof typeof groups, MethodGroup][]) {
    const scoredMiners = group.miners.filter(m => m.score > 0)
    const acceptedMiners = miners.filter(
      m => m.methodType === type && m.status === "Accepted"
    )

    group.count = group.miners.length
    group.avgScore = scoredMiners.length > 0 
      ? scoredMiners.reduce((sum, m) => sum + m.score, 0) / scoredMiners.length 
      : 0
    group.medianScore = median(scoredMiners.map(m => m.score))
    group.topScore = scoredMiners.length > 0 
      ? Math.max(...scoredMiners.map(m => m.score)) 
      : 0
    group.acceptanceRate = group.count > 0 
      ? acceptedMiners.length / group.count 
      : 0

    // Sort miners by score descending
    group.miners.sort((a, b) => b.score - a.score)
    // Keep top 10
    group.miners = group.miners.slice(0, 10)
  }

  return groups
}

function createEmptyGroup(): MethodGroup {
  return {
    count: 0,
    avgScore: 0,
    medianScore: 0,
    topScore: 0,
    acceptanceRate: 0,
    miners: []
  }
}

/**
 * Analyze signal effectiveness across all miners
 */
export function analyzeSignalEffectiveness(miners: MinerData[]): SignalEffectiveness[] {
  const signalStats: Map<string, { scores: number[]; count: number }> = new Map()

  for (const miner of miners) {
    if (miner.score <= 0) continue // Skip unscored

    for (const signal of miner.signals) {
      const stats = signalStats.get(signal) || { scores: [], count: 0 }
      stats.scores.push(miner.score)
      stats.count++
      signalStats.set(signal, stats)
    }
  }

  const results: SignalEffectiveness[] = []

  for (const [signal, stats] of signalStats.entries()) {
    const avgScore = stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length
    results.push({
      signal,
      avgScore: Math.round(avgScore * 100) / 100,
      sampleSize: stats.count,
      trend: getSignalTrend(stats.count, avgScore)
    })
  }

  // Sort by avgScore descending
  results.sort((a, b) => b.avgScore - a.avgScore)

  return results
}

/**
 * Find saturated approaches (many miners using same signals)
 */
export function findSaturatedApproaches(
  signalEffectiveness: SignalEffectiveness[]
): string[] {
  return signalEffectiveness
    .filter(s => s.sampleSize >= 3)
    .map(s => {
      const signalName = s.signal.replace(/_/g, " ")
      return `${signalName} (${s.sampleSize} miners)`
    })
    .slice(0, 5)
}

/**
 * Find open lanes (valuable signals nobody is using)
 */
export function findOpenLanes(
  signalEffectiveness: SignalEffectiveness[],
  miners: MinerData[]
): string[] {
  const usedSignals = new Set(signalEffectiveness.map(s => s.signal))
  
  const openLanes: string[] = []
  
  for (const lane of OPEN_LANE_SIGNALS) {
    if (!usedSignals.has(lane.signal)) {
      openLanes.push(`${lane.name} (0 miners)`)
    } else {
      const usage = signalEffectiveness.find(s => s.signal === lane.signal)
      if (usage && usage.sampleSize <= 1) {
        openLanes.push(`${lane.name} (${usage.sampleSize} miner)`)
      }
    }
  }

  return openLanes.slice(0, 5)
}

/**
 * Generate top insight from analysis
 */
export function generateTopInsight(
  methodGroups: AnalysisResult["methodGroups"],
  signalEffectiveness: SignalEffectiveness[]
): string {
  const behavioral = methodGroups.behavioral_detection
  const fingerprinting = methodGroups.fingerprinting

  const insights: string[] = []

  // Compare method types
  if (behavioral.avgScore > fingerprinting.avgScore * 1.5) {
    const ratio = Math.round(behavioral.avgScore / Math.max(fingerprinting.avgScore, 0.01))
    insights.push(`Behavioral detection miners outperform fingerprinting miners ${ratio}:1.`)
  }

  // Highlight top signal
  const topSignal = signalEffectiveness.find(s => s.trend === "hot")
  if (topSignal) {
    insights.push(`${topSignal.signal.replace(/_/g, " ")} has ${Math.round(topSignal.avgScore * 100)}% avg score.`)
  }

  // Acceptance rate insight
  if (behavioral.acceptanceRate >= 0.9) {
    insights.push(`Behavioral detection has ${Math.round(behavioral.acceptanceRate * 100)}% acceptance rate.`)
  }

  return insights.join(" ") || "Insufficient data for insights."
}

/**
 * Full analysis runner
 */
export function runAnalysis(miners: MinerData[]): AnalysisResult {
  const methodGroups = groupByMethodType(miners)
  const signalEffectiveness = analyzeSignalEffectiveness(miners)
  const saturatedApproaches = findSaturatedApproaches(signalEffectiveness)
  const openLanes = findOpenLanes(signalEffectiveness, miners)
  const topInsight = generateTopInsight(methodGroups, signalEffectiveness)

  return {
    timestamp: new Date().toISOString(),
    methodGroups,
    signalEffectiveness,
    saturatedApproaches,
    openLanes,
    topInsight
  }
}
