# ADA Detection Framework

Browser automation framework detection system for Bittensor Subnet 61 (RedTeam).

## Overview

This detection system identifies 10 different browser automation frameworks and distinguishes them from human sessions. The detection is based on stack trace analysis, WebGL fingerprinting, and other browser environment signals.

## The 10 Frameworks

| Framework | Detection Method | Status |
|-----------|-----------------|--------|
| puppeteer | "pptr:evaluate" in stack | ✅ Confirmed |
| puppeteer_extra | Stack + WebGL renderer | ✅ Confirmed |
| playwright | "UtilityScript" in stack + chrome.app | ✅ Confirmed |
| patchright | "UtilityScript" in stack - chrome.app | ✅ Confirmed |
| nodriver | "<anonymous>" in stack | ⚠️ Needs differentiation |
| zendriver | "<anonymous>" in stack | ⚠️ Needs differentiation |
| selenium_driverless | "<anonymous>" in stack | ⚠️ Critical - needs solution |
| seleniumbase | $cdc_ or "<anonymous>" in stack | ⚠️ Critical - needs solution |
| webdriver | navigator.webdriver | ✅ Protocol check |
| websocket | WebSocket connections | ✅ Protocol check |

## Kill Conditions

- **Miss EITHER seleniumbase OR selenium_driverless** → score = 0
- **Flag more than 1 human session as bot** → score = 0
- **Miss more than 1 protocol check (webdriver/websocket)** → score = 0

## Confirmed Working Signals

### Stack Trace Analysis

```
Human (<script> tag):    "Error: scan\n    at file:///path/file.html:14:19"
Puppeteer (evaluate):    "Error: scan\n    at pptr:evaluate;scanName:16:19"
Playwright (evaluate):   "Error: scan\n    at eval (eval at evaluate (:290:30))\n    at UtilityScript.evaluate (<anonymous>:290:30)"
Patchright (evaluate):   Same as Playwright (UtilityScript)
Raw CDP (nodriver etc):  "Error: scan\n    at <anonymous>:1:474"
```

### WebGL Renderer

- **puppeteer_extra**: "Intel Iris OpenGL Engine" (stealth plugin changes it)
- **Others**: Normal renderer string

### Chrome API Check

- **patchright**: chrome.app === false (removed)
- **playwright**: chrome.app exists
- **Others**: chrome.app exists or undefined

## Confirmed Dead Signals (NSTBrowser strips these)

- `$cdc_` window properties: 0 for all frameworks
- `window.__playwright`, `window.__puppeteer`: all false
- `navigator.webdriver`: false for all (NSTBrowser spoofs it)
- Underscore property count: 0 for all
- `Function.prototype.toString` native check: native for all
- `chrome.runtime`: false for ALL including baseline

## The 3 Unsolved Problems

### Problem 1: Selenium Detection (CRITICAL)

**seleniumbase** uses chromedriver binary. **selenium_driverless** uses CDP directly.

In NSTBrowser, both show ZERO unique artifacts. Yet top miners detect them perfectly.

**Questions:**
- Does validator run selenium through NSTBrowser or its own Chrome?
- If own Chrome: $cdc_ artifacts WOULD exist
- If NSTBrowser: What artifacts are we missing?

### Problem 2: nodriver vs zendriver Separation

Scans show they are **literally identical**. Same stack traces, same properties.

**Possibilities:**
- Validator injects framework-identifying info
- CDP session-level differences
- Timing differences in initialization
- Different default behaviors

### Problem 3: Human False Positive Prevention

If validator uses CDP `Runtime.evaluate` for human sessions, stack shows `<anonymous>` — same as nodriver/zendriver.

**Need to confirm:** How does validator execute detection code for human sessions?

## Usage

### Individual Detection

```javascript
// Load specific detection
const detectPuppeteer = require('./detection/puppeteer');
const isPuppeteer = detectPuppeteer();
```

### Full Detection Suite

```javascript
// Load full detector
const ADAFrameworkDetector = require('./detection');

// Run all detections
const results = ADAFrameworkDetector.detectAll();
console.log(results);
// {
//   puppeteer: false,
//   puppeteer_extra: false,
//   playwright: true,
//   patchright: false,
//   ...
// }

// Get summary
const summary = ADAFrameworkDetector.getSummary();
console.log(summary);
// {
//   detected: ['playwright'],
//   count: 1,
//   isBot: true,
//   results: { ... }
// }
```

## File Structure

```
detection/
├── index.js              # Main detection module
├── puppeteer.js          # Puppeteer detection
├── puppeteer_extra.js    # Puppeteer Extra detection
├── playwright.js         # Playwright detection
├── patchright.js         # Patchright detection
├── nodriver.js           # Nodriver detection
├── zendriver.js          # Zendriver detection
├── selenium_driverless.js # Selenium Driverless detection
├── seleniumbase.js       # Seleniumbase detection
├── webdriver.js          # Webdriver protocol detection
├── websocket.js          # WebSocket detection
└── README.md             # This file
```

## Research Notes

### Stack Trace Signatures

Each framework injects code differently:
- **Puppeteer**: `pptr:evaluate` in stack
- **Playwright/Patchright**: `UtilityScript` in stack
- **Raw CDP**: `<anonymous>` in stack
- **Human**: `file://` in stack (if script tag)

### WebGL Fingerprinting

Only **puppeteer_extra** changes the WebGL renderer to "Intel Iris OpenGL Engine" via its stealth plugin.

### Chrome API Modifications

Only **patchright** removes `chrome.app` from the Chrome API.

## Next Steps

1. **Investigate validator source code** at https://github.com/RedTeamSubnet/RedTeam-Subnet
2. **Find selenium differentiator** - #1 priority
3. **Find nodriver/zendriver differentiator**
4. **Confirm human session execution method**
5. **Explore additional detection vectors**:
   - `performance.getEntries()`
   - DOM mutation artifacts
   - `document.readyState` timing
   - Service workers
   - `crossOriginIsolated`
   - Resource timing API

## References

- [RedTeam Subnet Validator](https://github.com/RedTeamSubnet/RedTeam-Subnet)
- [NSTBrowser](https://www.nstbrowser.io/) - Anti-detect browser
- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)
- [Puppeteer](https://pptr.dev/)
- [Playwright](https://playwright.dev/)
- [Selenium](https://www.selenium.dev/)