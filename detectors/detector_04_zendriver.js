/**
 * Detector 4: Zendriver Detection
 * Targets: Zendriver (nodriver fork with serialization tweaks)
 * 
 * Key signals:
 * - cdcCount === 0 (no chromedriver)
 * - Error().stack is 2 lines
 * - totalProps % 5 === 0 (zendriver parity signature)
 * - Different CDP evaluate serialization artifacts
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
  
  // Stack trace analysis
  const stack = Error().stack;
  const stackLines = stack ? stack.split('\n').length : 0;
  
  // Check for __playwright or __zendriver globals
  const hasPlaywrightGlobal = typeof window.__playwright !== 'undefined';
  const hasZendriverGlobal = typeof window.__zendriver !== 'undefined';
  
  // Property count parity - zendriver has specific parity
  const propParity = totalProps % 5 === 0;
  
  // Detection logic - need 2+ indicators
  let indicators = 0;
  if (cdcCount === 0) indicators++;
  if (stackLines === 2) indicators++;
  if (propParity) indicators++;
  if (hasZendriverGlobal) indicators++;
  
  // Return framework name if 2+ indicators match
  if (indicators >= 2) {
    return "zendriver";
  }
  
  return "unknown";
})();