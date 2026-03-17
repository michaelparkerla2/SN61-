/**
 * Puppeteer Detection Script
 * Detects puppeteer framework via stack trace analysis
 * 
 * Confirmed signal: "pptr:evaluate" in Error().stack
 */

function detectPuppeteer() {
  try {
    // Check stack trace for puppeteer signature
    const stack = new Error().stack || "";
    
    // Puppeteer injects code with "pptr:evaluate" in the stack
    if (stack.includes("pptr:evaluate")) {
      return true;
    }
    
    // Additional check: puppeteer-specific globals (may not exist in NSTBrowser)
    if (typeof window !== 'undefined' && window.__puppeteer) {
      return true;
    }
    
    return false;
  } catch (e) {
    return false;
  }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = detectPuppeteer;
}

// Return result
detectPuppeteer();