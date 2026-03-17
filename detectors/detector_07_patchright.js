/**
 * Detector 7: Patchright Detection
 * Targets: Patchright (playwright fork with stealth patches)
 * 
 * Key signals:
 * - "UtilityScript" in Error().stack (playwright family)
 * - window.chrome.app MISSING (key differentiator from playwright)
 * - Patched navigator properties
 * - Different property enumeration
 */

(function() {
  // Stack trace check - UtilityScript in playwright family
  const stack = Error().stack || "";
  const hasUtilityScript = stack.includes("UtilityScript");
  
  // chrome.app check - MISSING in patchright (key differentiator)
  const hasChromeApp = !!(window.chrome && window.chrome.app);
  
  // Check for patchright-specific globals
  const hasPatchrightGlobal = typeof window.__patchright !== 'undefined';
  
  // Property count analysis
  const keys = Object.getOwnPropertyNames(window);
  const totalProps = keys.length;
  
  // navigator.webdriver check
  const hasWebdriver = navigator.webdriver === true;
  
  // User agent
  const ua = navigator.userAgent.toLowerCase();
  
  // Detection logic - need 2+ indicators
  let indicators = 0;
  if (hasUtilityScript) indicators++;
  if (!hasChromeApp) indicators++; // Key differentiator from playwright
  if (hasPatchrightGlobal) indicators++;
  if (hasWebdriver) indicators++;
  
  // Return framework name if 2+ indicators match
  if (indicators >= 2) {
    return "patchright";
  }
  
  return "unknown";
})();