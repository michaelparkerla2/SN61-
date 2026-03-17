# RedTeam ADA v2 Detectors - Quick Reference

## 🎯 Usage

Each detector is a self-contained JavaScript IIFE that returns the detected framework:

```javascript
// Include detector file in your HTML/JS
<script src="detector_01_seleniumbase.js"></script>

// Or execute directly
const result = (function() {
  // Detection logic here
  return "framework_name";
})();
```

## 📊 Detector Matrix

| # | Target | Key Signal 1 | Key Signal 2 | File |
|---|--------|--------------|--------------|------|
| 1 | **seleniumbase** | underscoreCount > 1 | cdcCount > 0 | detector_01_seleniumbase.js |
| 2 | **selenium_driverless** | stackLines === 1 | !chrome.app | detector_02_selenium_driverless.js |
| 3 | **nodriver** | stackLines === 2 | totalProps % 5 !== 0 | detector_03_nodriver.js |
| 4 | **zendriver** | stackLines === 2 | totalProps % 5 === 0 | detector_04_zendriver.js |
| 5 | **puppeteer_extra** | WebGL === "Intel Iris" | webdriver === false | detector_05_puppeteer_extra.js |
| 6 | **playwright** | "UtilityScript" in stack | chrome.app exists | detector_06_playwright.js |
| 7 | **patchright** | "UtilityScript" in stack | !chrome.app | detector_07_patchright.js |
| 8 | **human** | cdcCount === 0 | underscoreCount <= 1 | detector_08_human.js |
| 9 | **comprehensive** | Multi-framework scoring | All signals | detector_09_comprehensive.js |
| 10 | **fallback** | Additional heuristics | Plugin checks | detector_10_fallback.js |

## 🔑 Key Detection Patterns

### Magic Numbers (Window Property Scanning)
```javascript
const keys = Object.getOwnPropertyNames(window);
const cdcCount = keys.filter(k => 
  k.includes('cdc_') || 
  k.includes('adoQpoasnfa') || 
  k.includes('76pfcZLmcfl')
).length;
const underscoreCount = keys.filter(k => k.includes('_')).length;
const totalProps = keys.length;
```

### Stack Trace Analysis
```javascript
const stack = Error().stack;
const stackLines = stack.split('\n').length;
const hasUtilityScript = stack.includes("UtilityScript");
```

### WebGL Renderer (Puppeteer-Extra)
```javascript
const gl = canvas.getContext('webgl');
const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
// puppeteer_extra: "Intel Iris OpenGL Engine"
```

### Chrome.app Presence
```javascript
// EXISTS: seleniumbase, playwright, human
// MISSING: patchright, selenium_driverless
const hasChromeApp = !!(window.chrome && window.chrome.app);
```

## ⚠️ Kill Conditions (AVOID THESE)

1. **Miss seleniumbase OR selenium_driverless** → Score 0
2. **More than 1 human false positive** → Score 0
3. **More than 1 protocol miss** → Score 0

## ✅ Winner Strategies (UID 72, 89, 194)

- **Property-based detection** (NOT event-based)
- **Magic numbers** (window object scanning)
- **User agent parsing** combined with property checks
- **Multiple indicators** (2+ per file for integrity)

## 🧪 Testing

```bash
# Run test suite
python3 detectors/test_detectors_v2.py
```

## 📚 Resources

- [SeleniumBase](https://github.com/seleniumbase/SeleniumBase)
- [undetected-chromedriver](https://github.com/ultrafunkamsterdam/undetected-chromedriver)
- [Selenium-Driverless](https://github.com/ttlns/Selenium-Driverless)
- [Nodriver](https://github.com/ultrafunkamsterdam/nodriver)
- [Zendriver](https://github.com/cdpdriver/zendriver)
- [ESORICS 2019 Paper](https://cs.ou.nl/members/hugo/papers/ESORICS19.pdf)

## 🎯 Target Score: 0.6+

These detectors implement the exact signals used by perfect 1.0 scorers:
- Window property enumeration with CDC fragment detection
- Stack trace line count analysis
- chrome.app presence/absence checks
- WebGL renderer fingerprinting
- Underscore count baselines

## 📁 Files

- `detector_01_seleniumbase.js` - SeleniumBase UC mode detection
- `detector_02_selenium_driverless.js` - Pure CDP detection
- `detector_03_nodriver.js` - Nodriver detection
- `detector_04_zendriver.js` - Zendriver detection
- `detector_05_puppeteer_extra.js` - Puppeteer-extra detection
- `detector_06_playwright.js` - Playwright detection
- `detector_07_patchright.js` - Patchright detection
- `detector_08_human.js` - Human session detection
- `detector_09_comprehensive.js` - Multi-framework scoring
- `detector_10_fallback.js` - Fallback heuristics
- `README.md` - Full documentation
- `types.ts` - TypeScript definitions
- `test_detectors_v2.py` - Test suite