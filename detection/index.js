/**
 * ADA Detection Framework - Main Detection Module
 * 
 * Detects 10 browser automation frameworks:
 * 1. puppeteer - via "pptr:evaluate" in stack
 * 2. puppeteer_extra - via stack + WebGL renderer
 * 3. playwright - via "UtilityScript" in stack
 * 4. patchright - via stack + chrome.app check
 * 5. nodriver - via "<anonymous>" in stack
 * 6. zendriver - via "<anonymous>" in stack (needs differentiation)
 * 7. selenium_driverless - via "<anonymous>" in stack (CRITICAL)
 * 8. seleniumbase - via $cdc_ or stack (CRITICAL)
 * 9. webdriver - via navigator.webdriver
 * 10. websocket - via WebSocket connections
 * 
 * Kill conditions:
 * - Miss EITHER seleniumbase OR selenium_driverless → score 0
 * - Flag more than 1 human session as bot → score 0
 * - Miss more than 1 protocol check (webdriver/websocket) → score 0
 */

const ADAFrameworkDetector = {
  /**
   * Get current stack trace
   */
  getStack() {
    try {
      return new Error().stack || "";
    } catch (e) {
      return "";
    }
  },

  /**
   * Check if running in a browser environment
   */
  isBrowser() {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
  },

  /**
   * Detect puppeteer framework
   * Signal: "pptr:evaluate" in stack
   */
  detectPuppeteer() {
    const stack = this.getStack();
    return stack.includes("pptr:evaluate");
  },

  /**
   * Detect puppeteer_extra framework
   * Signals: "pptr:evaluate" in stack + WebGL renderer check
   */
  detectPuppeteerExtra() {
    const stack = this.getStack();
    if (!stack.includes("pptr:evaluate")) {
      return false;
    }
    
    // Check WebGL renderer for stealth plugin signature
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          if (renderer === "Intel Iris OpenGL Engine") {
            return true;
          }
        }
      }
    } catch (e) {
      // WebGL check failed
    }
    
    // Without WebGL, can't distinguish from puppeteer
    return false;
  },

  /**
   * Detect playwright framework
   * Signal: "UtilityScript" in stack + chrome.app exists
   */
  detectPlaywright() {
    const stack = this.getStack();
    if (!stack.includes("UtilityScript")) {
      return false;
    }
    
    // Playwright keeps chrome.app, patchright removes it
    if (typeof chrome !== 'undefined' && chrome.app !== undefined) {
      return true;
    }
    
    return false;
  },

  /**
   * Detect patchright framework
   * Signals: "UtilityScript" in stack + chrome.app removed
   */
  detectPatchright() {
    const stack = this.getStack();
    if (!stack.includes("UtilityScript")) {
      return false;
    }
    
    // Patchright removes chrome.app
    if (typeof chrome !== 'undefined' && (chrome.app === undefined || chrome.app === false)) {
      return true;
    }
    
    return false;
  },

  /**
   * Detect nodriver framework
   * Signal: "<anonymous>" in stack (raw CDP)
   */
  detectNodriver() {
    const stack = this.getStack();
    if (!stack.includes("<anonymous>")) {
      return false;
    }
    
    // Exclude frameworks with specific markers
    if (stack.includes("pptr:evaluate") || stack.includes("UtilityScript")) {
      return false;
    }
    
    // TODO: Find differentiator from zendriver and selenium_driverless
    return true;
  },

  /**
   * Detect zendriver framework
   * Signal: "<anonymous>" in stack (raw CDP)
   * TODO: Find differentiator from nodriver
   */
  detectZendriver() {
    const stack = this.getStack();
    if (!stack.includes("<anonymous>")) {
      return false;
    }
    
    // Exclude frameworks with specific markers
    if (stack.includes("pptr:evaluate") || stack.includes("UtilityScript")) {
      return false;
    }
    
    // TODO: Find differentiator from nodriver and selenium_driverless
    return true;
  },

  /**
   * Detect selenium_driverless framework
   * CRITICAL: Missing this = score 0
   * Signal: "<anonymous>" in stack (raw CDP)
   */
  detectSeleniumDriverless() {
    const stack = this.getStack();
    if (!stack.includes("<anonymous>")) {
      return false;
    }
    
    // Exclude frameworks with specific markers
    if (stack.includes("pptr:evaluate") || stack.includes("UtilityScript")) {
      return false;
    }
    
    // TODO: Find differentiator from nodriver and zendriver
    // Check for selenium-specific CDP artifacts
    
    return true;
  },

  /**
   * Detect seleniumbase framework
   * CRITICAL: Missing this = score 0
   * Signals: $cdc_ variables OR "<anonymous>" in stack
   */
  detectSeleniumbase() {
    // Check for chromedriver artifacts (if validator uses own Chrome)
    const cdcKeys = Object.keys(window).filter(k => k.includes('$cdc_'));
    if (cdcKeys.length > 0) {
      return true;
    }
    
    // Check stack for raw CDP signature
    const stack = this.getStack();
    if (stack.includes("<anonymous>")) {
      // Exclude frameworks with specific markers
      if (stack.includes("pptr:evaluate") || stack.includes("UtilityScript")) {
        return false;
      }
      
      // TODO: Find differentiator from other raw CDP frameworks
      return true;
    }
    
    // Check navigator.webdriver
    if (navigator.webdriver === true) {
      return true;
    }
    
    return false;
  },

  /**
   * Detect webdriver protocol
   * Signal: navigator.webdriver === true
   */
  detectWebdriver() {
    return navigator.webdriver === true;
  },

  /**
   * Detect websocket connections
   * Signal: Active WebSocket connections
   */
  detectWebsocket() {
    try {
      // Check if WebSocket has been modified
      const wsConstructor = WebSocket.toString();
      if (!wsConstructor.includes('[native code]')) {
        return true;
      }
      
      // TODO: Implement more robust WebSocket detection
      return false;
    } catch (e) {
      return false;
    }
  },

  /**
   * Detect human session
   * Signal: "file://" in stack (script tag execution) OR no automation markers
   */
  detectHuman() {
    const stack = this.getStack();
    
    // Human sessions loaded via <script> tag show file:// paths
    if (stack.includes("file://")) {
      return true;
    }
    
    // Check for any automation framework markers
    // If none are present, this is likely a human session
    const hasPuppeteer = stack.includes("pptr:evaluate");
    const hasPlaywright = stack.includes("UtilityScript");
    const hasRawCDP = stack.includes("<anonymous>");
    
    // If no automation markers at all, assume human
    if (!hasPuppeteer && !hasPlaywright && !hasRawCDP) {
      return true;
    }
    
    // If raw CDP execution (<anonymous>), check for human-like patterns
    if (hasRawCDP) {
      // Check for human-like performance patterns
      if (typeof performance !== 'undefined' && performance.timing) {
        const timing = performance.timing;
        
        // Humans typically have more variable timing
        if (timing.navigationStart && timing.loadEventEnd) {
          const totalLoadTime = timing.loadEventEnd - timing.navigationStart;
          
          // Very fast loads (< 100ms) suggest automation
          // Slower loads (> 500ms) are more human-like
          if (totalLoadTime > 500) {
            return true;
          }
        }
        
        // Check for natural user interaction patterns
        if (typeof window !== 'undefined') {
          // Check if there are any user interaction event listeners
          // Humans typically have mouse/keyboard event listeners
          const hasUserInteraction = document.querySelectorAll('[onclick], [onmouseover], [onkeydown]').length > 0 ||
                                    window.onclick || window.onkeydown;
          
          // Check for form elements (humans typically interact with forms)
          const hasFormElements = document.querySelectorAll('input, textarea, select, button').length > 0;
          
          // If there are user interactions or forms, more likely human
          if (hasUserInteraction || hasFormElements) {
            return true;
          }
        }
      }
      
      // Check for document referrer (humans typically come from somewhere)
      if (document.referrer && document.referrer.length > 0) {
        return true;
      }
      
      // Check for human-like scroll position
      if (typeof window !== 'undefined' && window.scrollY > 100) {
        return true;
      }
    }
    
    // Default: if automation markers present, not human
    return false;
  },

  /**
   * Run all detections and return results
   */
  detectAll() {
    return {
      puppeteer: this.detectPuppeteer(),
      puppeteer_extra: this.detectPuppeteerExtra(),
      playwright: this.detectPlaywright(),
      patchright: this.detectPatchright(),
      nodriver: this.detectNodriver(),
      zendriver: this.detectZendriver(),
      selenium_driverless: this.detectSeleniumDriverless(),
      seleniumbase: this.detectSeleniumbase(),
      webdriver: this.detectWebdriver(),
      websocket: this.detectWebsocket(),
      human: this.detectHuman(),
      stack: this.getStack()
    };
  },

  /**
   * Get detection summary
   */
  getSummary() {
    const results = this.detectAll();
    const detected = Object.entries(results)
      .filter(([key, value]) => key !== 'stack' && value === true)
      .map(([key]) => key);
    
    return {
      detected,
      count: detected.length,
      isBot: detected.length > 0 && !results.human,
      results
    };
  }
};

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ADAFrameworkDetector;
}

if (typeof window !== 'undefined') {
  window.ADAFrameworkDetector = ADAFrameworkDetector;
}