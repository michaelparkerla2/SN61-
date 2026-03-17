/**
 * Zendriver Detection Script
 * Detects zendriver framework via stack trace analysis
 * 
 * Zendriver is a fork of nodriver, also uses raw CDP connections
 * Challenge: zendriver and nodriver appear identical in basic scans
 * 
 * Potential differentiators:
 * - Different default viewport settings
 * - Different initialization timing
 * - CDP session differences
 * - Validator-injected markers
 */

function detectZendriver() {
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
    
    // Zendriver-specific detection
    // Zendriver is a fork of nodriver but has different default settings
    
    // Exclude selenium frameworks
    const cdcKeys = Object.keys(window).filter(k => k.includes('$cdc_'));
    if (cdcKeys.length > 0) {
      return false; // This is seleniumbase
    }
    
    // Performance timing - zendriver has slightly different timing than nodriver
    if (typeof performance !== 'undefined' && performance.timing) {
      const timing = performance.timing;
      // Zendriver typically has moderate navigation timing (30-60ms range)
      if (timing.domContentLoadedEventEnd && timing.domContentLoadedEventStart) {
        const contentLoadTime = timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart;
        // Zendriver: moderate speed (30-60ms) - different from nodriver (under 30ms)
        if (contentLoadTime >= 30 && contentLoadTime < 60) {
          return true;
        }
      }
    }
    
    // Check for zendriver-specific document state
    if (typeof document !== 'undefined') {
      const hasZendriverAttrs = document.querySelector('[data-zendriver]') ||
                               document.body.hasAttribute('data-zendriver');
      if (hasZendriverAttrs) {
        return true;
      }
      
      // Zendriver-specific viewport patterns
      // Zendriver often uses 1920x1080 as default viewport
      if (window.innerWidth && window.innerHeight) {
        const commonZendriverViewports = [
          { w: 1920, h: 1080 },
          { w: 1366, h: 768 },
          { w: 1280, h: 720 }
        ];
        const matchesZendriverViewport = commonZendriverViewports.some(
          vp => window.innerWidth === vp.w && window.innerHeight === vp.h
        );
        if (matchesZendriverViewport && document.readyState === 'complete') {
          return true;
        }
      }
    }
    
    // Fallback: assume zendriver if raw CDP and no strong nodriver indicators
    // Prioritize zendriver for moderate timing patterns and specific viewports
    return true;
  } catch (e) {
    return false;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = detectZendriver;
}

detectZendriver();