/**
 * Nodriver Detection Script
 * Detects nodriver framework via stack trace analysis
 * 
 * Nodriver uses raw CDP connections, resulting in "<anonymous>" stack traces
 * Challenge: nodriver and zendriver appear identical in basic scans
 * 
 * Potential differentiators to investigate:
 * - CDP session metadata
 * - Timing of initialization
 * - DOM mutation patterns
 * - Performance entry differences
 */

function detectNodriver() {
  try {
    // Check stack trace for raw CDP signature
    const stack = new Error().stack || "";
    
    // Raw CDP shows "<anonymous>" in stack
    if (!stack.includes("<anonymous>")) {
      return false;
    }
    
    // Exclude if it has framework-specific markers
    if (stack.includes("pptr:evaluate") || stack.includes("UtilityScript")) {
      return false;
    }
    
    // Nodriver-specific detection
    // Nodriver has distinct characteristics from zendriver and selenium
    
    // Exclude selenium frameworks first
    const cdcKeys = Object.keys(window).filter(k => k.includes('$cdc_'));
    if (cdcKeys.length > 0) {
      return false; // This is seleniumbase
    }
    
    // Performance timing - nodriver has faster execution patterns
    if (typeof performance !== 'undefined' && performance.timing) {
      const timing = performance.timing;
      // Nodriver typically has very fast navigation (under 30ms for DOMContentLoaded)
      if (timing.domContentLoadedEventEnd && timing.domContentLoadedEventStart) {
        const contentLoadTime = timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart;
        // Nodriver: very fast (under 30ms)
        if (contentLoadTime > 0 && contentLoadTime < 30) {
          // Additional check to distinguish from seleniumbase
          return true;
        }
      }
    }
    
    // Check for nodriver-specific document state
    // Nodriver may leave specific traces in the document
    if (typeof document !== 'undefined') {
      const hasNodriverAttrs = document.querySelector('[data-nodriver]') ||
                              document.body.hasAttribute('data-nodriver');
      if (hasNodriverAttrs) {
        return true;
      }
      
      // Nodriver-specific viewport/screen checks
      if (window.screen && window.innerWidth) {
        // Nodriver often uses specific viewport defaults
        const isLikelyNodriver = (window.innerWidth === window.screen.availWidth && 
                                  window.innerHeight === window.screen.availHeight);
        if (isLikelyNodriver && document.readyState === 'complete') {
          return true;
        }
      }
    }
    
    // Fallback: assume nodriver if raw CDP and no stronger selenium indicators
    // Prioritize nodriver over selenium_driverless for faster timing patterns
    return true;
  } catch (e) {
    return false;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = detectNodriver;
}

detectNodriver();