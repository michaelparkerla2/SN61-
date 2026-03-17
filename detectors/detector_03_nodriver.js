/**
 * Detector 3: Nodriver Detection
 * Targets: Nodriver (Python CDP client)
 * 
 * Key signals:
 * - cdcCount === 0 (no chromedriver)
 * - Error().stack is 2 lines (vs 1 for driverless, vs zendriver parity check)
 * - window.chrome.app may be missing or different
 * - Specific property count range
 */

(function() {
  // Get all window properties
  const keys = Object.getOwnPropertyNames(window);
  const totalProps = keys.length;
  
  // Count CDC-like artifacts
  const cdcCount = keys.filter(k => 
    k.includes('cdc_') || 
    k.includes('adoQpoasnfa') || 
    k.includes('76pfcZLmcfl') || 
    /\$?[a-z]{3,}_[a-z0-9]{20,}_?/.test(k)
  ).length;
  
  // Stack trace analysis - nodriver has 2-line stack
  const stack = Error().stack;
  const stackLines = stack ? stack.split('\n').length : 0;
  
  // Check chrome.app
  const hasChromeApp = !!(window.chrome && window.chrome.app);
  
  // Property count parity (nodriver vs zendriver differentiation)
  const propParity = totalProps % 5;
  
  // User agent check
  const ua = navigator.userAgent.toLowerCase();
  
  // Detection logic - need 2+ indicators
  let indicators = 0;
  if (cdcCount === 0) indicators++;
  if (stackLines === 2) indicators++;
  if (!hasChromeApp) indicators++;
  if (propParity !== 0) indicators++; // Different from zendriver
  
  // Return framework name if 2+ indicators match
  if (indicators >= 2) {
    return "nodriver";
  }
  
  return "unknown";
})();