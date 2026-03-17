/**
 * Webdriver Detection Script
 * Detects if navigator.webdriver is true
 * 
 * This is a protocol-level check that should be independent of framework
 * Some validators may set navigator.webdriver = true for automation sessions
 */

function detectWebdriver() {
  try {
    // Check navigator.webdriver property
    // This is the standard way to detect WebDriver automation
    if (navigator.webdriver === true) {
      return true;
    }
    
    // Check for webdriver-related properties
    // Some frameworks may set these even if navigator.webdriver is spoofed
    
    // Check for chrome-specific webdriver indicators
    if (typeof chrome !== 'undefined' && chrome.webdriver !== undefined) {
      return true;
    }
    
    // Check for other webdriver globals
    if (typeof window !== 'undefined') {
      if (window.webdriver || window.__webdriver_script_fn) {
        return true;
      }
    }
    
    return false;
  } catch (e) {
    return false;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = detectWebdriver;
}

detectWebdriver();