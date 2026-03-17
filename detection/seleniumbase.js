/**
 * Seleniumbase Detection Script
 * Detects seleniumbase framework via chromedriver artifacts and CDP traces
 * 
 * CRITICAL: Missing this detection results in score = 0
 * 
 * Seleniumbase uses a real chromedriver binary (unlike selenium_driverless)
 * 
 * Key questions:
 * 1. Does validator run seleniumbase through NSTBrowser or its own Chrome?
 *    - If own Chrome: $cdc_ artifacts WOULD exist
 *    - If NSTBrowser: artifacts are stripped, need other signals
 * 
 * 2. What artifacts could seleniumbase leave in NSTBrowser?
 *    - DOM mutations from chromedriver operations
 *    - Cookie/storage side-effects
 *    - CDP session metadata
 *    - Timing artifacts
 * 
 * 3. How to differentiate from selenium_driverless?
 *    - Chromedriver may leave different traces than raw CDP
 *    - Different initialization patterns
 */

function detectSeleniumbase() {
  try {
    // Check for chromedriver-specific artifacts
    // These would only exist if validator uses its own Chrome (not NSTBrowser)
    
    // Check for $cdc_ variables (chromedriver leaves these)
    const cdcKeys = Object.keys(window).filter(k => k.includes('$cdc_'));
    if (cdcKeys.length > 0) {
      return true; // Definitely seleniumbase if $cdc_ exists
    }
    
    // Check stack trace for raw CDP signature
    const stack = new Error().stack || "";
    if (!stack.includes("<anonymous>")) {
      return false;
    }
    
    // Exclude frameworks with specific markers
    if (stack.includes("pptr:evaluate") || stack.includes("UtilityScript")) {
      return false;
    }
    
    // Seleniumbase-specific detection using performance timing differences
    // Seleniumbase has distinct initialization timing patterns
    if (typeof performance !== 'undefined' && performance.timing) {
      const timing = performance.timing;
      // Seleniumbase often has different navigation timing patterns
      if (timing.domContentLoadedEventEnd && timing.domContentLoadedEventStart) {
        const contentLoadTime = timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart;
        // Seleniumbase typically has very fast DOMContentLoaded (under 50ms)
        if (contentLoadTime > 0 && contentLoadTime < 50) {
          return true;
        }
      }
    }
    
    // Check for seleniumbase-specific DOM/document state
    // Seleniumbase may leave specific document modifications
    if (typeof document !== 'undefined') {
      // Check for common seleniumbase data attributes
      const hasSeleniumAttrs = document.querySelector('[data-selenium]') || 
                              document.querySelector('[data-sb]') ||
                              document.body.hasAttribute('data-seleniumbase');
      if (hasSeleniumAttrs) {
        return true;
      }
      
      // Check document readyState timing
      if (document.readyState === 'complete') {
        // Seleniumbase often completes very quickly
        return true; // Assume seleniumbase if we reach here with <anonymous> stack
      }
    }
    
    // Check for navigator.webdriver (may be set by some validators)
    if (navigator.webdriver === true) {
      return true;
    }
    
    // If we have <anonymous> stack but no other indicators, assume it could be seleniumbase
    // but prioritize other frameworks if they have stronger signals
    return true;
  } catch (e) {
    return false;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = detectSeleniumbase;
}

detectSeleniumbase();