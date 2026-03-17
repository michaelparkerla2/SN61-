/**
 * Detector 2: Selenium-Driverless Detection
 * Targets: Selenium-Driverless (pure CDP client, no chromedriver)
 * 
 * Key signals:
 * - cdcCount === 0 (no chromedriver injection)
 * - !window.chrome || !window.chrome.app (missing chrome.app)
 * - Error().stack is 1-line (vs 2+ for nodriver/zendriver)
 * - No webdriver flag
 */

(function() {
  // Get all window properties
  const keys = Object.getOwnPropertyNames(window);
  const totalProps = keys.length;
  
  // Count CDC-like artifacts (should be 0 for driverless)
  const cdcCount = keys.filter(k => 
    k.includes('cdc_') || 
    k.includes('adoQpoasnfa') || 
    k.includes('76pfcZLmcfl') || 
    /\$?[a-z]{3,}_[a-z0-9]{20,}_?/.test(k)
  ).length;
  
  // Check chrome.app (missing in driverless)
  const hasChromeApp = !!(window.chrome && window.chrome.app);
  
  // Stack trace analysis - driverless has 1-line stack
  const stack = Error().stack;
  const stackLines = stack ? stack.split('\n').length : 0;
  
  // Check navigator.webdriver
  const hasWebdriver = navigator.webdriver === true;
  
  // User agent
  const ua = navigator.userAgent.toLowerCase();
  
  // Detection logic - need 2+ indicators
  let indicators = 0;
  if (cdcCount === 0) indicators++;
  if (!hasChromeApp) indicators++;
  if (stackLines === 1) indicators++;
  if (!hasWebdriver) indicators++;
  
  // Return framework name if 2+ indicators match
  if (indicators >= 2) {
    return "selenium_driverless";
  }
  
  // Check for human
  if (cdcCount === 0 && hasChromeApp && stackLines > 1) {
    return "human";
  }
  
  return "unknown";
})();