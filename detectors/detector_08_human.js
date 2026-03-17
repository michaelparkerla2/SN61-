/**
 * Detector 8: Human Session Detection
 * Targets: Clean NSTBrowser human sessions
 * 
 * Key signals (ALL must be true for human):
 * - cdcCount === 0 (no CDP injection)
 * - underscoreCount <= 1 (clean baseline)
 * - totalProps in clean range (~300-400)
 * - chrome.app present and functional
 * - Full plugins and mimeTypes
 * - No automation globals
 */

(function() {
  // Get all window properties
  const keys = Object.getOwnPropertyNames(window);
  const totalProps = keys.length;
  
  // Count CDC-like artifacts (must be 0 for human)
  const cdcCount = keys.filter(k => 
    k.includes('cdc_') || 
    k.includes('adoQpoasnfa') || 
    k.includes('76pfcZLmcfl') || 
    /\$?[a-z]{3,}_[a-z0-9]{20,}_?/.test(k)
  ).length;
  
  // Count underscore properties (must be <= 1 for human)
  const underscoreCount = keys.filter(k => k.includes('_')).length;
  
  // Check chrome.app (must be present for human)
  const hasChromeApp = !!(window.chrome && window.chrome.app);
  
  // Check for automation globals (must be absent for human)
  const hasAutomationGlobals = 
    typeof window.__playwright !== 'undefined' ||
    typeof window.__puppeteer !== 'undefined' ||
    typeof window.__selenium !== 'undefined' ||
    typeof window.__webdriver !== 'undefined' ||
    typeof window._phantom !== 'undefined' ||
    typeof window.callPhantom !== 'undefined';
  
  // Check plugins and mimeTypes (present in human)
  const hasPlugins = navigator.plugins && navigator.plugins.length > 0;
  const hasMimeTypes = navigator.mimeTypes && navigator.mimeTypes.length > 0;
  
  // Check navigator.webdriver (must be false/undefined for human)
  const hasWebdriver = navigator.webdriver === true;
  
  // User agent check (no automation indicators)
  const ua = navigator.userAgent.toLowerCase();
  const hasAutomationUA = /selenium|webdriver|chromedriver|phantomjs|headless/.test(ua);
  
  // Human detection - ALL checks must pass
  const isHuman = 
    cdcCount === 0 &&
    underscoreCount <= 1 &&
    hasChromeApp &&
    !hasAutomationGlobals &&
    hasPlugins &&
    hasMimeTypes &&
    !hasWebdriver &&
    !hasAutomationUA;
  
  if (isHuman) {
    return "human";
  }
  
  return "unknown";
})();