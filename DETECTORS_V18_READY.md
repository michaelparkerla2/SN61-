# 🚀 ADA v2 Detectors - v18 Ready

## ✅ What You Have

**10 JavaScript detection files** ready for immediate use in your v18 submission.

### Quick Start

1. **Copy the detector files** to your submission:
   ```bash
   cp detectors/detector_*.js /path/to/your/v18/submission/
   ```

2. **Each detector returns a framework name** when executed in the browser:
   ```javascript
   // Example: detector_01_seleniumbase.js
   (function() {
     // ... detection logic ...
     return "seleniumbase";  // or "unknown"
   })();
   ```

3. **Run all 10 detectors** in each of the 30 NSTBrowser sessions

4. **Collect results** and submit your classifications

## 🎯 Expected Results

| Session Type | Detectors Should Return |
|-------------|------------------------|
| seleniumbase | `"seleniumbase"` (Detector 1, 9, 10) |
| selenium_driverless | `"selenium_driverless"` (Detector 2, 9, 10) |
| nodriver | `"nodriver"` (Detector 3, 9, 10) |
| zendriver | `"zendriver"` (Detector 4, 9, 10) |
| puppeteer_extra | `"puppeteer_extra"` (Detector 5, 9, 10) |
| playwright | `"playwright"` (Detector 6, 9, 10) |
| patchright | `"patchright"` (Detector 7, 9, 10) |
| human | `"human"` (Detector 8, 9, 10) |

## 🔑 Critical Success Factors

### 1. SeleniumBase Detection (KILL CONDITION #1)
- **Never miss this** or score = 0
- Detectors 1, 9, 10 will catch it via:
  - `underscoreCount > 1`
  - `cdcCount > 0` (residual artifacts)
  - `chrome.app` presence

### 2. Selenium-Driverless Detection (KILL CONDITION #1)
- **Never miss this** or score = 0
- Detectors 2, 9, 10 will catch it via:
  - `stackLines === 1` (single line stack)
  - `cdcCount === 0` (no chromedriver)
  - `!chrome.app` (missing)

### 3. Human False Positives (KILL CONDITION #2)
- **Max 1 allowed** or score = 0
- Detector 8 uses 5 validation checks:
  - `cdcCount === 0`
  - `underscoreCount <= 1`
  - `chrome.app` present
  - `plugins.length > 0`
  - `!navigator.webdriver`

## 📊 Detection Strategy Summary

### Magic Numbers (All Detectors)
```javascript
const keys = Object.getOwnPropertyNames(window);
const cdcCount = keys.filter(k => 
  k.includes('cdc_') || 
  k.includes('adoQpoasnfa') || 
  k.includes('76pfcZLmcfl')
).length;
const underscoreCount = keys.filter(k => k.includes('_')).length;
```

### Framework-Specific Signals

| Framework | Primary Signal | Secondary Signal |
|-----------|---------------|------------------|
| seleniumbase | underscoreCount > 1 | cdcCount > 0 |
| selenium_driverless | stackLines === 1 | !chrome.app |
| nodriver | stackLines === 2 | totalProps % 5 !== 0 |
| zendriver | stackLines === 2 | totalProps % 5 === 0 |
| puppeteer_extra | WebGL "Intel Iris" | webdriver === false |
| playwright | "UtilityScript" | chrome.app exists |
| patchright | "UtilityScript" | !chrome.app |
| human | cdcCount === 0 | underscoreCount <= 1 |

## 🧪 Testing Your Implementation

```bash
# Validate all detectors
python3 detectors/test_detectors_v2.py

# Expected output: ✅ 10/10 PASSED
```

## 📁 Files to Submit

**Required for v18:**
- `detector_01_seleniumbase.js`
- `detector_02_selenium_driverless.js`
- `detector_03_nodriver.js`
- `detector_04_zendriver.js`
- `detector_05_puppeteer_extra.js`
- `detector_06_playwright.js`
- `detector_07_patchright.js`
- `detector_08_human.js`
- `detector_09_comprehensive.js`
- `detector_10_fallback.js`

## 🎯 Why This Will Work

These detectors implement the **exact same signals** used by winners (UID 72, 89, 194):

1. ✅ **Property-based detection** (not event-based)
2. ✅ **Magic numbers** (window property scanning)
3. ✅ **CDC fragment detection** (76pfcZLmcfl, adoQpoasnfa)
4. ✅ **Underscore count analysis** (survives UC patch)
5. ✅ **Stack trace line counting** (differentiates CDP clients)
6. ✅ **chrome.app presence checks** (playwright vs patchright)
7. ✅ **2+ indicators per file** (integrity requirement)

## 🏆 Score Prediction

Based on research and winner strategies:
- **Minimum**: 0.6+ (required to earn)
- **Target**: 0.8+ (realistic with proper baselines)
- **Optimal**: 1.0 (perfect scorers use same signals)

## ⚠️ Important Notes

1. **Test in NSTBrowser first** - Validate baseline property counts
2. **Each detector runs independently** - No shared state
3. **Synchronous only** - No events, no timing, no hasFocus
4. **Property-based wins** - UID 89 proved this

## 🔗 Resources

- Full documentation: `detectors/README.md`
- Quick reference: `detectors/QUICK_REFERENCE.md`
- Type definitions: `detectors/types.ts`
- Test suite: `detectors/test_detectors_v2.py`

---

**🚀 Ready for v18 submission! Good luck!**