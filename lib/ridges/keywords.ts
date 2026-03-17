/**
 * Ridges Keywords - Signal keyword extraction and analysis
 */

// Signal keywords mapping - technique names to search terms
export const SIGNAL_KEYWORDS: Record<string, string[]> = {
  event_tracking: [
    "event tracking", "user events", "event listener", "mousemove", 
    "keyboard event", "keydown", "keyup", "click event", "pointer event"
  ],
  scoring_system: [
    "scoring system", "weighted score", "confidence score", "score threshold",
    "scoring", "weighted", "confidence threshold", "points system"
  ],
  canvas_fingerprint: [
    "canvas", "canvas fingerprint", "todataurl", "2d canvas", 
    "canvas rendering", "canvas hash", "getimagedata"
  ],
  webgl: [
    "webgl", "webgl2", "gl.getparameter", "webgl rendering",
    "webgl fingerprint", "renderer info", "webgl vendor"
  ],
  audio_fingerprint: [
    "audio", "audiocontext", "oscillator", "audio fingerprint",
    "audio hash", "offline audio", "audio buffer"
  ],
  property_checks: [
    "property check", "navigator.", "window.", "static check", 
    "synchronous check", "sync check", "environmental check"
  ],
  behavioral_async: [
    "async", "asynchronous", "behavioral analysis", "behavioral detection",
    "observation", "behavioral", "async detection"
  ],
  mouse_activity: [
    "mouse activity", "mouse movement", "mouse tracking", "cursor",
    "mouse pattern", "pointer tracking"
  ],
  magic_numbers: [
    "magic number", "screen dimensions", "window properties", 
    "specific numbers", "hardcoded value", "dimension check"
  ],
  timing_analysis: [
    "timing", "performance.now", "raf", "requestanimationframe", 
    "cadence", "timing analysis", "frame timing"
  ],
  stack_trace: [
    "stack trace", "stack depth", "error stack", "stack frame",
    "call stack", "stack analysis"
  ],
  heap_memory: [
    "heap", "memory", "performance.memory", "jsheapsize",
    "memory usage", "heap size"
  ],
  focus_blur: [
    "focus", "blur", "hasfocus", "visibility", "visibilitystate",
    "document.hasfocus", "focus event"
  ],
  websocket_detection: [
    "websocket", "cdp", "devtools protocol", "ws://",
    "websocket connection", "chrome devtools"
  ],
  webdriver_detection: [
    "webdriver", "navigator.webdriver", "chromedriver", "$cdc_",
    "webdriver property", "automation detected"
  ],
  hash_algorithm: [
    "hash", "fnv", "sha", "md5", "hashing algorithm",
    "hash function", "fingerprint hash"
  ],
  font_detection: [
    "font", "font enumeration", "font detection", "font fingerprint",
    "font list", "installed fonts"
  ],
  intl_api: [
    "intl", "intl.datetimeformat", "intl api", "locale",
    "intl.numberformat", "date format"
  ],
  error_handling: [
    "try catch", "error handling", "exception", "error object",
    "error message"
  ],
  globals_detection: [
    "__playwright", "pptr://", "selenium", "puppeteer", "playwright",
    "phantom", "nightmare", "webdriver globals"
  ],
  magic_numbers_ada: [
    "cdc_", "adoQpoasnfa", "76pfcZLmcfl", "window property count",
    "underscore count", "property enumeration", "magic number detection"
  ],
  seleniumbase_detection: [
    "seleniumbase", "undetected chromedriver", "UC mode", "binary patch",
    "prototype override", "residual symbol", "chromedriver patcher"
  ],
  selenium_driverless_detection: [
    "selenium driverless", "pure CDP", "no chromedriver", "CDP client",
    "single line stack", "missing chrome.app"
  ],
  nodriver_detection: [
    "nodriver", "ultrafunkamsterdam", "async CDP", "two line stack",
    "python CDP", "nodriver fingerprint"
  ],
  zendriver_detection: [
    "zendriver", "cdpdriver", "nodriver fork", "serialization tweak",
    "property parity", "zendriver evaluate"
  ],
  puppeteer_extra_detection: [
    "puppeteer extra", "intel iris", "webgl renderer", "headless chrome",
    "stealth plugin", "webdriver false"
  ],
  playwright_detection: [
    "playwright", "utilityscript", "microsoft automation", "__playwright",
    "PW inspector", "playwright global"
  ],
  patchright_detection: [
    "patchright", "playwright fork", "missing chrome.app", "patched playwright",
    "stealth patches", "utilityscript present"
  ],
  human_detection: [
    "human detection", "clean session", "no automation", "zero CDC",
    "property baseline", "NSTBrowser human", "plugin enumeration"
  ]
}

// All keywords for complete list
export const ALL_SIGNALS = Object.keys(SIGNAL_KEYWORDS)

/**
 * Extract signals from a method description
 */
export function extractSignals(methodDescription: string): string[] {
  const desc = methodDescription.toLowerCase()
  const found: string[] = []
  
  for (const [signal, keywords] of Object.entries(SIGNAL_KEYWORDS)) {
    if (keywords.some(kw => desc.includes(kw.toLowerCase()))) {
      found.push(signal)
    }
  }
  
  return found
}

/**
 * Check if specific signal is present in description
 */
export function hasSignal(description: string, signal: string): boolean {
  const keywords = SIGNAL_KEYWORDS[signal]
  if (!keywords) return false
  
  const desc = description.toLowerCase()
  return keywords.some(kw => desc.includes(kw.toLowerCase()))
}

/**
 * Get signal trend based on usage count and scores
 */
export function getSignalTrend(
  count: number, 
  avgScore: number
): "hot" | "effective" | "saturated" | "risky" | "weak" {
  if (count >= 4) return "saturated"
  if (avgScore >= 0.9 && count <= 2) return "hot"
  if (avgScore >= 0.7) return "effective"
  if (avgScore >= 0.5) return "risky"
  return "weak"
}

/**
 * Keyword categories for grouping
 */
export const SIGNAL_CATEGORIES = {
  behavioral: [
    "event_tracking", "mouse_activity", "focus_blur", 
    "behavioral_async", "timing_analysis"
  ],
  fingerprinting: [
    "canvas_fingerprint", "webgl", "audio_fingerprint", 
    "font_detection", "hash_algorithm"
  ],
  environmental: [
    "property_checks", "magic_numbers", "webdriver_detection",
    "websocket_detection", "globals_detection"
  ],
  analysis: [
    "scoring_system", "stack_trace", "heap_memory", 
    "error_handling", "intl_api"
  ]
}

/**
 * Get category for a signal
 */
export function getSignalCategory(signal: string): string {
  for (const [category, signals] of Object.entries(SIGNAL_CATEGORIES)) {
    if (signals.includes(signal)) return category
  }
  return "other"
}

/**
 * Calculate signal importance score (for weighting in similarity)
 * Higher = more important/distinctive signals
 */
export function getSignalImportance(signal: string): number {
  const importanceMap: Record<string, number> = {
    // High importance - distinctive behavioral signals
    event_tracking: 0.9,
    behavioral_async: 0.85,
    timing_analysis: 0.8,
    scoring_system: 0.8,
    focus_blur: 0.75,
    mouse_activity: 0.75,
    
    // Medium importance - detection signals
    websocket_detection: 0.7,
    webdriver_detection: 0.7,
    globals_detection: 0.7,
    stack_trace: 0.65,
    heap_memory: 0.65,
    
    // Lower importance - common fingerprinting (saturated)
    canvas_fingerprint: 0.5,
    webgl: 0.5,
    audio_fingerprint: 0.5,
    font_detection: 0.45,
    
    // Basic signals
    property_checks: 0.4,
    magic_numbers: 0.4,
    hash_algorithm: 0.35,
    intl_api: 0.3,
    error_handling: 0.25
  }
  
  return importanceMap[signal] ?? 0.5
}

/**
 * Open lanes - signals that are theoretically valuable but rarely used
 */
export const OPEN_LANE_SIGNALS = [
  { signal: "timing_analysis", name: "RAF timing analysis" },
  { signal: "heap_memory", name: "Memory heap patterns" },
  { signal: "stack_trace", name: "Error stack depth analysis" },
  { signal: "focus_blur", name: "Focus state monitoring" },
  { signal: "intl_api", name: "Intl API fingerprinting" }
]
