/**
 * TypeScript type definitions for RedTeam ADA v2 Detectors
 * 
 * These types define the structure and return values for the
 * JavaScript detection files used in the ADA v2 challenge.
 */

/**
 * Framework types that can be detected
 */
export type Framework = 
  | "seleniumbase"
  | "selenium_driverless"
  | "nodriver"
  | "zendriver"
  | "puppeteer_extra"
  | "playwright"
  | "patchright"
  | "human"
  | "unknown";

/**
 * Result from running a detector
 */
export interface DetectionResult {
  /** The detected framework */
  framework: Framework;
  /** Confidence score (0-1) */
  confidence: number;
  /** Indicators that triggered the detection */
  indicators: string[];
  /** Raw detector output */
  raw: string;
}

/**
 * Detector metadata
 */
export interface DetectorMetadata {
  /** Detector number (1-10) */
  id: number;
  /** Detector filename */
  filename: string;
  /** Primary target framework */
  target: Framework;
  /** Detection techniques used */
  techniques: DetectionTechnique[];
  /** Required indicator count */
  minIndicators: number;
}

/**
 * Detection techniques used
 */
export type DetectionTechnique =
  | "magic_numbers"
  | "window_property_scan"
  | "stack_trace_analysis"
  | "chrome_app_check"
  | "webgl_fingerprint"
  | "user_agent_parsing"
  | "cdc_artifact_detection"
  | "underscore_count"
  | "global_check"
  | "plugin_enumeration";

/**
 * Detection strategy configuration
 */
export interface DetectionStrategy {
  /** Detector files to use */
  detectors: number[];
  /** Framework priority order */
  priority: Framework[];
  /** Fallback strategy */
  fallback: "majority_vote" | "highest_confidence" | "comprehensive";
}

/**
 * Default detection strategy for ADA v2
 */
export const DEFAULT_STRATEGY: DetectionStrategy = {
  detectors: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  priority: [
    "seleniumbase",
    "selenium_driverless",
    "nodriver",
    "zendriver",
    "puppeteer_extra",
    "playwright",
    "patchright",
    "human"
  ],
  fallback: "comprehensive"
};

/**
 * Detector metadata for all 10 detectors
 */
export const DETECTOR_METADATA: DetectorMetadata[] = [
  {
    id: 1,
    filename: "detector_01_seleniumbase.js",
    target: "seleniumbase",
    techniques: [
      "magic_numbers",
      "window_property_scan",
      "cdc_artifact_detection",
      "underscore_count",
      "chrome_app_check"
    ],
    minIndicators: 2
  },
  {
    id: 2,
    filename: "detector_02_selenium_driverless.js",
    target: "selenium_driverless",
    techniques: [
      "magic_numbers",
      "window_property_scan",
      "stack_trace_analysis",
      "chrome_app_check"
    ],
    minIndicators: 2
  },
  {
    id: 3,
    filename: "detector_03_nodriver.js",
    target: "nodriver",
    techniques: [
      "magic_numbers",
      "window_property_scan",
      "stack_trace_analysis"
    ],
    minIndicators: 2
  },
  {
    id: 4,
    filename: "detector_04_zendriver.js",
    target: "zendriver",
    techniques: [
      "magic_numbers",
      "window_property_scan",
      "stack_trace_analysis",
      "global_check"
    ],
    minIndicators: 2
  },
  {
    id: 5,
    filename: "detector_05_puppeteer_extra.js",
    target: "puppeteer_extra",
    techniques: [
      "webgl_fingerprint",
      "user_agent_parsing",
      "global_check"
    ],
    minIndicators: 2
  },
  {
    id: 6,
    filename: "detector_06_playwright.js",
    target: "playwright",
    techniques: [
      "stack_trace_analysis",
      "global_check",
      "chrome_app_check",
      "window_property_scan"
    ],
    minIndicators: 2
  },
  {
    id: 7,
    filename: "detector_07_patchright.js",
    target: "patchright",
    techniques: [
      "stack_trace_analysis",
      "chrome_app_check",
      "window_property_scan"
    ],
    minIndicators: 2
  },
  {
    id: 8,
    filename: "detector_08_human.js",
    target: "human",
    techniques: [
      "magic_numbers",
      "window_property_scan",
      "chrome_app_check",
      "plugin_enumeration",
      "global_check"
    ],
    minIndicators: 2
  },
  {
    id: 9,
    filename: "detector_09_comprehensive.js",
    target: "unknown",
    techniques: [
      "magic_numbers",
      "window_property_scan",
      "stack_trace_analysis",
      "webgl_fingerprint",
      "chrome_app_check",
      "global_check"
    ],
    minIndicators: 2
  },
  {
    id: 10,
    filename: "detector_10_fallback.js",
    target: "unknown",
    techniques: [
      "magic_numbers",
      "window_property_scan",
      "stack_trace_analysis",
      "plugin_enumeration",
      "global_check"
    ],
    minIndicators: 2
  }
];

/**
 * Magic numbers and patterns used for detection
 */
export const DETECTION_PATTERNS = {
  /** ChromeDriver injection fragments */
  cdcFragments: ["cdc_", "adoQpoasnfa", "76pfcZLmcfl"],
  /** Regex for CDC-like keys */
  cdcRegex: /\$?[a-z]{3,}_[a-z0-9]{20,}_?/,
  /** WebGL renderer for puppeteer-extra */
  puppeteerWebGLRenderer: "Intel Iris OpenGL Engine",
  /** Playwright stack indicator */
  playwrightStackIndicator: "UtilityScript",
  /** Clean property baseline range */
  cleanPropertyRange: { min: 300, max: 400 },
  /** Maximum underscore count for human */
  humanMaxUnderscore: 1
} as const;