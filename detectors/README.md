# RedTeam ADA v2 Detection Files

This directory contains 10 JavaScript detection files for the RedTeam SN61 ADA Detection v2 challenge.

## Challenge Requirements

- **30 browser sessions**: 6 humans, 24 bots (3 each of 8 frameworks)
- **Kill conditions** (any one = score 0):
  - Miss seleniumbase OR selenium_driverless
  - More than 1 human false positive
  - More than 1 protocol miss
- **Each file needs 2+ behavioral indicators** to pass integrity check
- **Target score**: 0.6+

## Frameworks to Detect

1. **seleniumbase** - UC mode with patched chromedriver
2. **selenium_driverless** - Pure CDP client (no chromedriver)
3. **nodriver** - Python CDP client
4. **zendriver** - Nodriver fork with serialization tweaks
5. **puppeteer-extra** - Puppeteer with stealth plugin
6. **playwright** - Microsoft automation framework
7. **patchright** - Playwright fork with stealth patches
8. **human** - Clean NSTBrowser sessions

## Detection Strategy

### Core Techniques (Property-Based)

Based on research from:
- undetected-chromedriver patcher.py
- ESORICS 2019 paper on fingerprint surface detection
- Framework GitHub repositories
- Winner strategies (UID 72, 89, 194)

#### 1. Magic Numbers / Window Property Scanning
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

#### 2. Stack Trace Analysis
```javascript
const stackLines = Error().stack.split('\n').length;
// selenium_driverless: 1 line
// nodriver/zendriver: 2 lines
// playwright/patchright: contains "UtilityScript"
```

#### 3. Chrome.app Presence
```javascript
// EXISTS in: playwright, seleniumbase, human
// MISSING in: patchright, selenium_driverless
const hasChromeApp = !!(window.chrome && window.chrome.app);
```

#### 4. WebGL Renderer (Puppeteer-Extra Unique)
```javascript
// "Intel Iris OpenGL Engine" uniquely identifies puppeteer_extra
const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
```

#### 5. User Agent Parsing
```javascript
const ua = navigator.userAgent.toLowerCase();
// Check for automation indicators
```

## Detector Files

| File | Target | Key Indicators |
|------|--------|----------------|
| detector_01_seleniumbase.js | seleniumbase | underscoreCount>1, cdcCount>0, chrome.app |
| detector_02_selenium_driverless.js | selenium_driverless | cdcCount===0, !chrome.app, stackLines===1 |
| detector_03_nodriver.js | nodriver | cdcCount===0, stackLines===2, propParity |
| detector_04_zendriver.js | zendriver | cdcCount===0, stackLines===2, totalProps%5===0 |
| detector_05_puppeteer_extra.js | puppeteer_extra | WebGL renderer, webdriver===false |
| detector_06_playwright.js | playwright | "UtilityScript", __playwright, chrome.app |
| detector_07_patchright.js | patchright | "UtilityScript", !chrome.app |
| detector_08_human.js | human | cdcCount===0, underscoreCount<=1, chrome.app, plugins |
| detector_09_comprehensive.js | All (scoring) | Multi-framework scoring system |
| detector_10_fallback.js | All (fallback) | Additional heuristics |

## Confirmed True Signals

1. ✅ `WebGL renderer === "Intel Iris OpenGL Engine"` → puppeteer_extra
2. ✅ `"UtilityScript" in Error().stack` → playwright/patchright family
3. ✅ `chrome.app` exists in playwright, MISSING in patchright
4. ✅ `navigator.webdriver` unreliable (varies by validator)
5. ✅ Winners use "magic numbers" (window property scanning)
6. ✅ Property-based detection > event-based (UID 89 fix)

## Usage

Each detector is a self-contained IIFE that returns the detected framework name:

```javascript
const result = (function() {
  // Detection logic
  return "framework_name";
})();
```

## Testing

Run the test file to verify detectors:
```bash
node detectors/test_detectors.js
```

## References

- [undetected-chromedriver patcher.py](https://github.com/ultrafunkamsterdam/undetected-chromedriver/blob/master/undetected_chromedriver/patcher.py)
- [ESORICS 2019 Paper](https://cs.ou.nl/members/hugo/papers/ESORICS19.pdf)
- [Selenium-Driverless](https://github.com/ttlns/Selenium-Driverless)
- [Nodriver](https://github.com/ultrafunkamsterdam/nodriver)
- [Zendriver](https://github.com/cdpdriver/zendriver)
- [RedTeam Subnet](https://github.com/RedTeamSubnet/RedTeam)