/**
 * Ridges Similarity - Similarity prediction for pre-submission checks
 */

import { getSignalImportance } from "./keywords"

export interface SimilarityResult {
  predictedSimilarity: number
  risk: "low" | "medium" | "high"
  reason: string
}

/**
 * Calculate Jaccard similarity between two sets
 */
function jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  const intersection = [...setA].filter(x => setB.has(x)).length
  const union = new Set([...setA, ...setB]).size
  return union > 0 ? intersection / union : 0
}

/**
 * Calculate weighted signal similarity
 * Weights signals by their importance
 */
function weightedSignalSimilarity(
  ourSignals: string[],
  theirSignals: string[]
): number {
  if (ourSignals.length === 0 || theirSignals.length === 0) return 0
  
  const ourSet = new Set(ourSignals)
  const theirSet = new Set(theirSignals)
  
  // Find overlapping signals and their weights
  const overlapping = [...ourSet].filter(s => theirSet.has(s))
  const totalOurWeight = ourSignals.reduce((sum, s) => sum + getSignalImportance(s), 0)
  const overlapWeight = overlapping.reduce((sum, s) => sum + getSignalImportance(s), 0)
  
  return totalOurWeight > 0 ? overlapWeight / totalOurWeight : 0
}

/**
 * Extract meaningful words from description
 */
function extractWords(description: string): Set<string> {
  return new Set(
    description
      .toLowerCase()
      .split(/\W+/)
      .filter(w => w.length > 3)
  )
}

/**
 * Predict similarity between our approach and a known miner's approach
 */
export function predictSimilarity(
  ourSignals: string[],
  ourDescription: string,
  theirSignals: string[],
  theirDescription: string
): SimilarityResult {
  // 1. Jaccard similarity on signal sets (40% weight)
  const ourSet = new Set(ourSignals)
  const theirSet = new Set(theirSignals)
  const jaccardSim = jaccardSimilarity(ourSet, theirSet)
  
  // 2. Category matching - both behavioral = base similarity
  const ourBehavioral = ourDescription.toLowerCase().includes("behavioral")
  const theirBehavioral = theirDescription.toLowerCase().includes("behavioral")
  const categoryMatch = ourBehavioral === theirBehavioral ? 0.1 : 0
  
  // 3. Keyword overlap in descriptions (30% weight)
  const ourWords = extractWords(ourDescription)
  const theirWords = extractWords(theirDescription)
  const wordOverlap = [...ourWords].filter(w => theirWords.has(w)).length
  const wordSim = Math.min(wordOverlap / Math.max(ourWords.size, 1), 0.5)
  
  // 4. Weighted signal overlap
  const weightedSim = weightedSignalSimilarity(ourSignals, theirSignals)
  
  // Combined weighted score
  const rawSim = 
    (jaccardSim * 0.3) + 
    categoryMatch + 
    (wordSim * 0.25) + 
    (weightedSim * 0.25)
  
  // Scale to realistic range (real scores are typically 0.15-0.50)
  const predictedSimilarity = Math.min(rawSim * 0.8 + 0.1, 0.95)
  
  // Determine risk level
  let risk: "low" | "medium" | "high" = "low"
  let reason = ""
  
  if (predictedSimilarity >= 0.45) {
    risk = "high"
    reason = "Very similar approach - high penalty risk"
  } else if (predictedSimilarity >= 0.35) {
    risk = "medium"
    reason = `Moderate overlap - ${overlappingSignalsDescription(ourSignals, theirSignals)}`
  } else {
    risk = "low"
    reason = "Sufficiently different methodology"
  }
  
  return {
    predictedSimilarity: Math.round(predictedSimilarity * 100) / 100,
    risk,
    reason
  }
}

/**
 * Get description of overlapping signals
 */
function overlappingSignalsDescription(
  ourSignals: string[],
  theirSignals: string[]
): string {
  const overlap = ourSignals.filter(s => theirSignals.includes(s))
  if (overlap.length === 0) return "different signal mix"
  if (overlap.length === 1) return `shared: ${overlap[0]}`
  return `shared: ${overlap.slice(0, 2).join(", ")}${overlap.length > 2 ? "..." : ""}`
}

/**
 * Check if submission is safe based on max similarity
 */
export function isSafeToSubmit(maxSimilarity: number): boolean {
  // Under 0.5 is generally safe (penalty threshold)
  return maxSimilarity < 0.45
}

/**
 * Generate guidance text based on similarity predictions
 */
export function generateGuidance(
  maxSimilarity: number,
  highestUid: string
): string {
  if (maxSimilarity < 0.30) {
    return "Excellent differentiation. Very low penalty risk."
  }
  
  if (maxSimilarity < 0.40) {
    return `Good differentiation. Max similarity ${maxSimilarity.toFixed(2)} to UID ${highestUid} - below penalty threshold.`
  }
  
  if (maxSimilarity < 0.50) {
    return `Caution: Max similarity ${maxSimilarity.toFixed(2)} to UID ${highestUid}. Consider adding unique signals to differentiate.`
  }
  
  return `Warning: High similarity ${maxSimilarity.toFixed(2)} to UID ${highestUid}. Significant penalty likely. Recommend changing approach.`
}
