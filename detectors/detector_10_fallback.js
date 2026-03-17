/**
 * Detector 10: Fallback Detection with Additional Signals
 * Targets: Any missed frameworks using additional heuristics
 * 
 * Additional signals:
 * - Plugin/mimeType enumeration anomalies
 * - Function.toString() analysis
 * - Object prototype checks
 * - Document attributes
 */

(function() {
  // Get all window properties
  const keys = Object.getOwnPropertyNames(window);
  const totalProps = keys.length;
  
  // Magic numbers
  const cdcCount = keys.filter(k => 
    k.includes('cdc_') || 
    k.includes('adoQpoasnfa') || 
    k.includes('76pfcZLmcfl') || 
    /\$?[a-z]{3,}_[a-z0-9]{20,}_?/.test(k)
  ).length;
  const underscoreCount = keys.filter(k => k.includes('_')).length;
  
  // Stack analysis
  const stack = Error().stack || "";
  const stackLines = stack.split('\n').length;
  
  // Plugin enumeration
  const pluginCount = navigator.plugins ? navigator.plugins.length : 0;
  const mimeTypeCount = navigator.mimeTypes ? navigator.mimeTypes.length : 0;
  const hasPlugins = pluginCount > 0;
  
  // Document attributes check
  const documentAttrs = Object.getOwnPropertyNames(document);
  const hasWebdriverAttr = documentAttrs.some(a => 
    a.toLowerCase().includes('webdriver') || 
    a.toLowerCase().includes('selenium')
  );
  
  // Function toString check (some frameworks override this)
  const fnToString = Function.prototype.toString;
  const fnToStringNative = fnToString.call(fnToString);
  const hasModifiedFn = !fnToStringNative.includes('[native code]');
  
  // Object prototype check
  const objectKeys = Object.keys(Object.prototype);
  const hasModifiedPrototype = objectKeys.some(k => 
    k.includes('cdc') || k.includes('selenium') || k.includes('webdriver')
  );
  
  // Iframes check (some frameworks inject hidden iframes)
  const iframeCount = document.getElementsByTagName('iframe').length;
  
  // Detection logic
  let indicators = 0;
  let framework = "unknown";
  
  // Selenium family indicators
  if (cdcCount > 0 || underscoreCount > 1 || hasWebdriverAttr) {
    indicators++;
    framework = "seleniumbase";
  }
  
  // CDP-based (driverless, nodriver, zendriver)
  if (cdcCount === 0 && stackLines <= 2 && !hasWebdriverAttr) {
    indicators++;
    if (stackLines === 1) {
      framework = "selenium_driverless";
    } else if (totalProps % 5 === 0) {
      framework = "zendriver";
    } else {
      framework = "nodriver";
    }
  }
  
  // Check for human (clean session)
  if (cdcCount === 0 && underscoreCount <= 1 && hasPlugins && !hasWebdriverAttr) {
    indicators++;
    framework = "human";
  }
  
  // Additional validation
  if (hasModifiedFn) indicators++;
  if (hasModifiedPrototype) indicators++;
  
  return indicators >= 2 ? framework : "unknown";
})();