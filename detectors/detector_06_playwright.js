/**
 * Detector 6: Playwright Detection
 * Targets: Playwright (Microsoft automation framework)
 * 
 * Key signals:
 * - "UtilityScript" in Error().stack (confirmed identifier)
 * - window.__playwright exists
 * - window.chrome.app exists (confirmed in playwright)
 * - Specific execution context artifacts
 */

(function() {
  // Stack trace check - UtilityScript is confirmed identifier
  const stack = Error().stack || "";
  const hasUtilityScript = stack.includes("UtilityScript");
  
  // Playwright globals
  const hasPlaywrightGlobal = typeof window.__playwright !== 'undefined';
  const hasPlaywrightUI = typeof window.__PW_inspector !== 'undefined';
  
  // chrome.app check (exists in playwright)
  const hasChromeApp = !!(window.chrome && window.chrome.app);
  
  // Check for playwright-specific properties
  const keys = Object.getOwnPropertyNames(window);
  const hasPlaywrightProps = keys.some(k => 
    k.toLowerCase().includes('playwright') || 
    k.toLowerCase().includes('pw_')
  );
  
  // Detection logic - need 2+ indicators
  let indicators = 0;
  if (hasUtilityScript) indicators++;
  if (hasPlaywrightGlobal) indicators++;
  if (hasChromeApp) indicators++;
  if (hasPlaywrightProps) indicators++;
  if (hasPlaywrightUI) indicators++;
  
  // Return framework name if 2+ indicators match
  if (indicators >= 2) {
    return "playwright";
  }
  
  return "unknown";
})();