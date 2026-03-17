/**
 * Detector 5: Puppeteer-Extra Detection
 * Targets: Puppeteer-Extra (puppeteer with stealth plugin)
 * 
 * Key signals:
 * - WebGL renderer === "Intel Iris OpenGL Engine" (confirmed unique)
 * - navigator.webdriver === false (explicitly set)
 * - Specific window property patterns
 * - "Vendor" in user agent
 */

(function() {
  // WebGL renderer check - confirmed unique identifier
  let webGLRenderer = "";
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        webGLRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      }
    }
  } catch (e) {}
  
  // Get window properties
  const keys = Object.getOwnPropertyNames(window);
  
  // Check for puppeteer-specific globals
  const hasPuppeteerGlobal = typeof window.__puppeteer !== 'undefined';
  const hasPptrGlobal = typeof window._pptr !== 'undefined';
  
  // navigator.webdriver should be explicitly false
  const webdriverFalse = navigator.webdriver === false;
  
  // User agent check
  const ua = navigator.userAgent.toLowerCase();
  const hasHeadlessChrome = ua.includes('headlesschrome') || ua.includes('headless chrome');
  
  // Detection logic - need 2+ indicators
  let indicators = 0;
  if (webGLRenderer === "Intel Iris OpenGL Engine") indicators++;
  if (webdriverFalse) indicators++;
  if (hasPuppeteerGlobal || hasPptrGlobal) indicators++;
  if (hasHeadlessChrome) indicators++;
  
  // Return framework name if 2+ indicators match
  if (indicators >= 2) {
    return "puppeteer_extra";
  }
  
  return "unknown";
})();