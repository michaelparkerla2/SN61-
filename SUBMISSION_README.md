# RedTeam SN61 ADA Detection v2 Submission
## Target Score: 0.8+ | UID: 182

---

## Overview

Complete Dockerized JavaScript solution for Bittensor Subnet 61 (RedTeam by Innerworks) ADA Detection v2 challenge. Detects 8 browser automation frameworks with zero human false positives.

---

## Architecture

### Master Signals (2 files)
- **webdriver.js**: Detects navigator.webdriver=true (Selenium tools)
- **websocket.js**: Detects CDP/WebSocket connection indicators

### Framework Detectors (8 files)
- **seleniumbase.js**: ChromeDriver with $cdc_ artifacts
- **selenium_driverless.js**: CDP direct, no chromedriver
- **playwright.js**: __playwright* globals
- **patchright.js**: Stealth Playwright, patched webdriver getter
- **puppeteer.js**: __puppeteer* globals, pptr:// stack
- **puppeteer_extra.js**: Stealth plugin, patched toString
- **nodriver.js**: Pure CDP Python, no framework globals
- **zendriver.js**: nodriver fork, zen* globals

---

## Key Differentiators

### Human Safety Gates
Every detector has explicit early-return false if human-like traits detected.

### Novel Signal Combinations (Avoiding UID 209,16,71,73,14 patterns)
1. Object descriptor analysis (Reflect.ownKeys)
2. Prototype chain integrity checks
3. Error stack structure analysis
4. Constructor identity verification
5. Native code detection via toString()
6. CDP binding detection (__ functions)

### Collision Prevention
- nodriver: No __playwright, __puppeteer, zen* globals
- zendriver: zen* globals present
- seleniumbase: $cdc_ artifacts required
- selenium_driverless: NO $cdc_ artifacts

---

## Build Instructions

### 1. Build Docker Image
```bash
docker build -t taotickler/rt-ada:v20250308_v5 .
docker tag taotickler/rt-ada:v20250308_v5 taotickler/rt-ada:latest
```

### 2. Push to Docker Hub
```bash
docker login
docker push taotickler/rt-ada:v20250308_v5
docker push taotickler/rt-ada:latest
```

### 3. Submit via Bittensor CLI
```bash
# Get image hash
docker images --digests taotickler/rt-ada

# Submit (replace with your actual hash)
btcli subnet commit --netuid 61 \
  --hotkey 5HDjG9NPW3PZC1TR1kDxdjvEsBsNkmtrmYS3tNqDWSKuZgHf \
  --hash sha256:YOUR_HASH_HERE \
  --encrypt

# Save encryption key - release after 24h
```

---

## How This Beats Competition

| Competitor | Their Approach | Our Improvement |
|------------|---------------|-----------------|
| UID 209 (1.0) | Simple static checks | Multi-signal ensembles |
| UID 16 (1.0) | Canvas fingerprinting | No hardcoded hashes |
| UID 71 (0.9) | Missed patchright | Patched getter detection |
| UID 14 (0.797) | Async analysis (banned) | Synchronous only |
| UID 73 (0.8) | nodriver/zendriver collisions | Clear differentiation |

---

## Validation Checklist

- [x] 10 files in detections/ folder
- [x] Each exports single detect_<framework>() function
- [x] Each < 500 lines
- [x] No global variables outside functions
- [x] No async/await
- [x] No network calls
- [x] Returns boolean only
- [x] Human safety gates present
- [x] 2+ distinct indicators per file
- [x] No hardcoded magic numbers

---

## Tool Integration

### Semkey (Novelty Check)
```bash
curl -X POST https://thesemkey.vercel.app/api/semkey/compute \
  -H "Content-Type: application/json" \
  -d "@templates/commit/src/detections/webdriver.js"
```

### RedFeed (Intel)
```bash
curl https://theredfeed.vercel.app/api/redteam-data
```

---

## Expected Performance

- Detection: 27-30/30 frameworks
- Human FP: 0/6
- Collisions: 0
- Null Rate: <0.1
- Similarity: <0.3
- Score: 0.8+ (target 1.0)

---

## Files Created

```
templates/commit/src/detections/
├── webdriver.js (65 lines)
├── websocket.js (124 lines)
├── seleniumbase.js (138 lines)
├── selenium_driverless.js (139 lines)
├── playwright.js (142 lines)
├── patchright.js (155 lines)
├── puppeteer.js (146 lines)
├── puppeteer_extra.js (160 lines)
├── nodriver.js (159 lines)
└── zendriver.js (142 lines)
```

Total: ~1,370 lines of deterministic, synchronous detection code.

---

**Deterministic by design. Human-safe by default. Built for 1.0.**