/**
 * Patchright Detection Script
 * Detects patchright framework via stack trace and chrome.app check
 * 
 * Confirmed signals:
 * - "UtilityScript" in Error().stack (same as playwright)
 * - chrome.app === false (patchright removes this API)
 */

function detectPatchright() {
  try {
    // Check stack trace for playwright/patchright signature
    const stack = new Error().stack || "";
    
    // Both playwright and patchright use "UtilityScript"
    if (!stack.includes("UtilityScript")) {
      return false;
    }
    
    // Check if chrome.app is removed (patchright specific)
    if (typeof chrome !== 'undefined') {
      // Patchright removes chrome.app entirely
      if (chrome.app === undefined || chrome.app === false) {
        return true;
      }
    }
    
    // If we can't determine via chrome.app, check for other patchright indicators
    // Patchright may have specific modifications to the chrome object
    if (typeof chrome !== 'undefined' && chrome.runtime === undefined) {
      // Both have chrome.runtime = false in NSTBrowser, so this isn't unique
      // But combined with UtilityScript, it suggests patchright
      return true;
    }
    
    return false;
  } catch (e) {
    return false;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = detectPatchright;
}

detectPatchright();