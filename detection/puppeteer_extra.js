/**
 * Puppeteer Extra Detection Script
 * Detects puppeteer with stealth plugin via stack trace and WebGL fingerprint
 * 
 * Confirmed signals:
 * - "pptr:evaluate" in Error().stack
 * - WebGL renderer = "Intel Iris OpenGL Engine" (stealth plugin changes it)
 */

function detectPuppeteerExtra() {
  try {
    // Check stack trace for puppeteer signature
    const stack = new Error().stack || "";
    
    // Both puppeteer and puppeteer_extra use "pptr:evaluate"
    if (!stack.includes("pptr:evaluate")) {
      return false;
    }
    
    // Check WebGL renderer - puppeteer_extra stealth plugin changes it
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          // puppeteer_extra stealth sets this to "Intel Iris OpenGL Engine"
          if (renderer === "Intel Iris OpenGL Engine") {
            return true;
          }
        }
      }
    } catch (e) {
      // WebGL check failed, fall back to stack-only
    }
    
    // If we have pptr:evaluate but not the WebGL signature, 
    // it could be either puppeteer or puppeteer_extra
    // Return true for both since we can't distinguish without WebGL
    return true;
  } catch (e) {
    return false;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = detectPuppeteerExtra;
}

detectPuppeteerExtra();