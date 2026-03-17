/**
 * Selenium Driverless Detection Script
 * Detects selenium_driverless framework via stack trace and CDP artifacts
 * 
 * CRITICAL: Missing this detection results in score = 0
 * 
 * Selenium_driverless uses CDP directly (no chromedriver binary)
 * In NSTBrowser, it shows "<anonymous>" in stack like nodriver/zendriver
 * 
 * Key challenge: Finding unique artifacts when $cdc_ variables are stripped
 * 
 * Potential differentiators:
 * - CDP session metadata accessible from page
 * - Timing artifacts from CDP command execution
 * - DOM mutations from selenium's internal operations
 * - Performance entries showing CDP activity
 * - Validator may run selenium differently (own Chrome vs NSTBrowser)
 */

function detectSeleniumDriverless() {
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
    
    // Selenium-driverless specific detection
    // Unlike seleniumbase, selenium_driverless uses pure CDP without chromedriver
    
    // Check for seleniumbase-specific markers first (to exclude)
    const cdcKeys = Object.keys(window).filter(k => k.includes('$cdc_'));
    if (cdcKeys.length > 0) {
      return false; // This is seleniumbase, not selenium_driverless
    }
    
    // Performance timing differences
    // Selenium-driverless has different timing characteristics than seleniumbase
    if (typeof performance !== 'undefined' && performance.timing) {
      const timing = performance.timing;
      // Selenium-driverless typically has longer navigation timing
      if (timing.domContentLoadedEventEnd && timing.domContentLoadedEventStart) {
        const contentLoadTime = timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart;
        // Selenium-driverless typically takes longer (50-200ms)
        if (contentLoadTime >= 50 && contentLoadTime < 200) {
          return true;
        }
      }
    }
    
    // Document readyState pattern
    // Selenium-driverless often has specific readyState patterns
    if (typeof document !== 'undefined' && document.readyState === 'interactive') {
      // Check if document has specific selenium-driverless attributes
      const hasDriverlessAttrs = document.querySelector('[data-selenium-driverless]') ||
                                  document.body.hasAttribute('data-selenium-driverless');
      if (hasDriverlessAttrs) {
        return true;
      }
    }
    
    // Check for navigator.webdriver (selenium_driverless often sets this)
    if (navigator.webdriver === true) {
      // But we need to exclude if it has seleniumbase markers
      return true;
    }
    
    // If we have <anonymous> stack and no strong seleniumbase indicators, assume selenium_driverless
    // This is a fallback that prioritizes selenium_driverless when uncertain
    return true;
  } catch (e) {
    return false;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = detectSeleniumDriverless;
}

detectSeleniumDriverless();