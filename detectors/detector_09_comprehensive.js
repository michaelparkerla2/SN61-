/**
 * Detector 9: Comprehensive Multi-Framework Detection
 * Targets: All frameworks with priority-based classification
 * 
 * Uses a scoring system to identify frameworks based on:
 * - Magic numbers (window property analysis)
 * - Stack trace patterns
 * - Global object presence
 * - User agent analysis
 * - WebGL fingerprints
 */

(function() {
  // Get all window properties
  const keys = Object.getOwnPropertyNames(window);
  const totalProps = keys.length;
  
  // Magic numbers analysis
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
  const hasUtilityScript = stack.includes("UtilityScript");
  
  // Global checks
  const hasChromeApp = !!(window.chrome && window.chrome.app);
  const hasPlaywrightGlobal = typeof window.__playwright !== 'undefined';
  const hasPuppeteerGlobal = typeof window.__puppeteer !== 'undefined';
  const hasWebdriver = navigator.webdriver === true;
  
  // WebGL check
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
  
  // User agent
  const ua = navigator.userAgent.toLowerCase();
  
  // Framework scoring
  const scores = {
    seleniumbase: 0,
    selenium_driverless: 0,
    nodriver: 0,
    zendriver: 0,
    puppeteer_extra: 0,
    playwright: 0,
    patchright: 0,
    human: 0
  };
  
  // Score each framework
  if (cdcCount > 0) scores.seleniumbase += 2;
  if (underscoreCount > 1) scores.seleniumbase += 1;
  if (hasChromeApp) scores.seleniumbase += 1;
  
  if (cdcCount === 0) scores.selenium_driverless += 1;
  if (!hasChromeApp) scores.selenium_driverless += 1;
  if (stackLines === 1) scores.selenium_driverless += 2;
  
  if (cdcCount === 0) scores.nodriver += 1;
  if (stackLines === 2) scores.nodriver += 1;
  if (totalProps % 5 !== 0) scores.nodriver += 1;
  
  if (cdcCount === 0) scores.zendriver += 1;
  if (stackLines === 2) scores.zendriver += 1;
  if (totalProps % 5 === 0) scores.zendriver += 1;
  
  if (webGLRenderer === "Intel Iris OpenGL Engine") scores.puppeteer_extra += 3;
  if (hasPuppeteerGlobal) scores.puppeteer_extra += 2;
  if (navigator.webdriver === false) scores.puppeteer_extra += 1;
  
  if (hasUtilityScript) scores.playwright += 2;
  if (hasPlaywrightGlobal) scores.playwright += 2;
  if (hasChromeApp) scores.playwright += 1;
  
  if (hasUtilityScript) scores.patchright += 2;
  if (!hasChromeApp) scores.patchright += 2;
  
  if (cdcCount === 0) scores.human += 1;
  if (underscoreCount <= 1) scores.human += 1;
  if (hasChromeApp) scores.human += 1;
  if (!hasWebdriver) scores.human += 1;
  
  // Find highest score
  let maxScore = 0;
  let detected = "unknown";
  for (const [framework, score] of Object.entries(scores)) {
    if (score > maxScore && score >= 2) {
      maxScore = score;
      detected = framework;
    }
  }
  
  return detected;
})();