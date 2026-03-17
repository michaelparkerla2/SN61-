/**
 * Detector 1: SeleniumBase UC Mode Detection
 * Targets: SeleniumBase (UC mode with patched chromedriver)
 * 
 * Key signals:
 * - underscoreCount > 1 (residual from prototype overrides)
 * - cdcCount > 0 (some UC versions miss full removal)
 * - totalProps > clean baseline
 * - chrome.app presence
 */

(function() {
  // Get all window properties
  const keys = Object.getOwnPropertyNames(window);
  const totalProps = keys.length;
  
  // Count CDC-like artifacts (magic fragments from chromedriver)
  const cdcCount = keys.filter(k => 
    k.includes('cdc_') || 
    k.includes('adoQpoasnfa') || 
    k.includes('76pfcZLmcfl') || 
    /\$?[a-z]{3,}_[a-z0-9]{20,}_?/.test(k)
  ).length;
  
  // Count underscore properties (survives binary patch)
  const underscoreCount = keys.filter(k => k.includes('_')).length;
  
  // Check chrome.app (present in SeleniumBase)
  const hasChromeApp = !!(window.chrome && window.chrome.app);
  
  // User agent parsing for selenium indicators
  const ua = navigator.userAgent.toLowerCase();
  const hasSeleniumUA = /selenium|webdriver|chromedriver/.test(ua);
  
  // Detection logic - need 2+ indicators
  let indicators = 0;
  if (cdcCount > 0) indicators++;
  if (underscoreCount > 1) indicators++;
  if (hasChromeApp) indicators++;
  if (hasSeleniumUA) indicators++;
  
  // Return framework name if 2+ indicators match
  if (indicators >= 2) {
    return "seleniumbase";
  }
  
  // Check for human (clean session)
  if (cdcCount === 0 && underscoreCount <= 1) {
    // Additional human checks
    const hasPlugins = navigator.plugins && navigator.plugins.length > 0;
    const hasMimeTypes = navigator.mimeTypes && navigator.mimeTypes.length > 0;
    if (hasPlugins && hasMimeTypes && !hasSeleniumUA) {
      return "human";
    }
  }
  
  return "unknown";
})();