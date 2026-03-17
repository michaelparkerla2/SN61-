/**
 * Playwright Detection Script
 * Detects playwright framework via stack trace analysis
 * 
 * Confirmed signal: "UtilityScript" in Error().stack
 * Note: Playwright and Patchright share the same stack signature
 */

function detectPlaywright() {
  try {
    // Check stack trace for playwright signature
    const stack = new Error().stack || "";
    
    // Playwright injects code with "UtilityScript" in the stack
    if (stack.includes("UtilityScript")) {
      // Check if chrome.app exists (patchright removes it)
      if (typeof chrome !== 'undefined' && chrome.app !== undefined) {
        return true; // Playwright keeps chrome.app
      }
      // If we can't check chrome.app, assume playwright (more common)
      return true;
    }
    
    // Additional check: playwright-specific globals (may not exist in NSTBrowser)
    if (typeof window !== 'undefined' && window.__playwright) {
      return true;
    }
    
    return false;
  } catch (e) {
    return false;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = detectPlaywright;
}

detectPlaywright();