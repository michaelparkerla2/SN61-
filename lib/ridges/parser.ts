/**
 * Ridges Parser - Utilities for parsing Red Feed data
 * Handles Validation Output and Comparison Logs parsing (non-standard JSON formats)
 */

export interface ParsedValidation {
  format: boolean
  integrity: {
    is_good: boolean
    reason: string
  }
  is_valid: boolean
  raw: string
}

export interface ComparisonEntry {
  reference: string
  uid: string
  commitHash: string
  reason: string
  similarity: number
}

export interface TestResult {
  testId: string
  collided: boolean
  detected: boolean
  expected_framework: string
  submitted_framework: string[]
  webdriver: boolean
  websocket: boolean
}

/**
 * Parse the Validation Output field which uses JS object notation (unquoted keys)
 * Example: {format:true,integrity:{is_good:true,reason:valid behavioral detection},is_valid:true,...}
 */
export function parseValidationOutput(valOutput: string): ParsedValidation {
  const result: ParsedValidation = {
    format: false,
    integrity: {
      is_good: false,
      reason: "unknown"
    },
    is_valid: false,
    raw: valOutput
  }

  if (!valOutput) return result

  try {
    // Extract integrity reason using regex
    const integrityMatch = valOutput.match(/integrity:\{[^}]*reason:([^},]+)/i)
    if (integrityMatch) {
      result.integrity.reason = integrityMatch[1].trim().replace(/,$/, "").replace(/\}$/, "")
    }

    // Extract is_good
    const isGoodMatch = valOutput.match(/is_good:(true|false)/i)
    if (isGoodMatch) {
      result.integrity.is_good = isGoodMatch[1].toLowerCase() === "true"
    }

    // Extract format
    const formatMatch = valOutput.match(/format:(true|false)/i)
    if (formatMatch) {
      result.format = formatMatch[1].toLowerCase() === "true"
    }

    // Extract is_valid
    const isValidMatch = valOutput.match(/is_valid:(true|false)/i)
    if (isValidMatch) {
      result.is_valid = isValidMatch[1].toLowerCase() === "true"
    }
  } catch {
    // Return partial result on error
  }

  return result
}

/**
 * Extract the method type from integrity reason
 * Returns "behavioral_detection" or "fingerprinting" based on reason text
 */
export function extractMethodType(integrityReason: string): "behavioral_detection" | "fingerprinting" | "unknown" {
  const lower = integrityReason.toLowerCase()
  
  if (lower.includes("behavioral detection") || lower.includes("behavioral analysis")) {
    return "behavioral_detection"
  }
  
  if (lower.includes("fingerprint")) {
    return "fingerprinting"
  }
  
  return "unknown"
}

/**
 * Parse Comparison Logs - these are usually valid JSON with quoted keys
 * Format: {"124_gAAAAABppZ":{"reason":"description...","similarity_score":0.21}, ...}
 */
export function parseComparisonLogs(compLogs: string): ComparisonEntry[] {
  const entries: ComparisonEntry[] = []
  
  if (!compLogs || compLogs === "{}" || compLogs === "null") return entries

  try {
    // Try parsing as JSON first
    const parsed = JSON.parse(compLogs)
    
    for (const [key, value] of Object.entries(parsed)) {
      const entry = value as { reason?: string; similarity_score?: number }
      const parts = key.split("_")
      const uid = parts[0] || "unknown"
      const commitHash = parts.slice(1).join("_")
      
      entries.push({
        reference: key,
        uid,
        commitHash,
        reason: entry.reason || "",
        similarity: entry.similarity_score ?? 0
      })
    }
  } catch {
    // Fallback: regex extraction
    const regex = /"(\d+_[^"]+)":\{"reason":"([^"]+)","similarity_score":([\d.]+)\}/g
    let match
    while ((match = regex.exec(compLogs)) !== null) {
      const parts = match[1].split("_")
      entries.push({
        reference: match[1],
        uid: parts[0] || "unknown",
        commitHash: parts.slice(1).join("_"),
        reason: match[2],
        similarity: parseFloat(match[3])
      })
    }
  }

  return entries
}

/**
 * Parse Result JSON - contains per-test detection results
 * Format: {"0":{"collided":false,"detected":true,"expected_framework":"puppeteer",...},...}
 */
export function parseResultJson(resultStr: string): TestResult[] {
  const results: TestResult[] = []
  
  if (!resultStr || resultStr === "null" || resultStr === "{}") return results

  try {
    // Clean up the string (may have extra quotes)
    let clean = resultStr
    if (clean.startsWith('"') && clean.endsWith('"')) {
      clean = clean.slice(1, -1)
    }
    clean = clean.replace(/""/g, '"')
    
    const parsed = JSON.parse(clean)
    
    for (const [testId, data] of Object.entries(parsed)) {
      const test = data as {
        collided?: boolean
        detected?: boolean
        expected_framework?: string
        submitted_framework?: string[]
        webdriver?: boolean
        websocket?: boolean
      }
      
      results.push({
        testId,
        collided: test.collided ?? false,
        detected: test.detected ?? false,
        expected_framework: test.expected_framework || "unknown",
        submitted_framework: test.submitted_framework || [],
        webdriver: test.webdriver ?? false,
        websocket: test.websocket ?? false
      })
    }
  } catch {
    // Return empty on parse error
  }

  return results
}

/**
 * Extract method description summary from comparison log reasons
 * Combines unique technique mentions into a summary
 */
export function extractMethodSummary(comparisonEntries: ComparisonEntry[]): string {
  if (comparisonEntries.length === 0) return "unknown method"
  
  // Get the most detailed reason (usually longest)
  const longestReason = comparisonEntries.reduce(
    (longest, entry) => entry.reason.length > longest.length ? entry.reason : longest,
    ""
  )
  
  // Truncate and clean up
  if (longestReason.length > 100) {
    return longestReason.substring(0, 97) + "..."
  }
  
  return longestReason || "method not described"
}

/**
 * Determine challenge type from test results
 * ADA = bot detection, DFP = fingerprinting
 */
export function determineChallengeType(testResults: TestResult[]): "ada" | "dfp" | "unknown" {
  if (testResults.length === 0) return "unknown"
  
  // If tests have framework detection, it's ADA
  const hasFramework = testResults.some(t => 
    t.expected_framework && t.expected_framework !== "human"
  )
  
  if (hasFramework) return "ada"
  
  return "dfp"
}
