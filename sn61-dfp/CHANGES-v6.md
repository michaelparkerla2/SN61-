# SN61 DFP v6 - Changes Summary

## Problem: v5 Rejection Analysis
- **Score**: 0 (Penalty: 0.45)
- **Issues**: 
  - null_rate: 0.5-0.83 (API blocks on Chrome/Brave/Safari/Firefox Focus/DuckDuckGo)
  - collision: 0.25 (low entropy, shared signals)
  - fragmentation: 0.4 (volatile signals like performance.now/battery/network)

## Fixes Applied

### 1. Storage Signals (Fixes null_rate 0.5-0.83)
**Problem**: localStorage/sessionStorage tests fail in private/incognito mode
**Solution**: Only check API availability with `typeof`, never actually test storage
```javascript
// OLD (caused null_rate):
localStorage.setItem('test', '1');  // Throws in private mode!

// NEW (safe in private mode):
localStorageAvailable: typeof window.localStorage !== 'undefined',
```

### 2. Font Detection (Fixes collision 0.25)
**Problem**: Only 22 fonts = insufficient entropy
**Solution**: Expanded to 80+ fonts across Windows, macOS, Linux, and web fonts
- Windows: Arial, Calibri, Segoe UI, etc.
- macOS: Helvetica, Avenir, San Francisco, etc.
- Linux: DejaVu, Liberation, Noto, Ubuntu, etc.
- Web: Open Sans, Roboto, Source Code Pro, etc.

### 3. WebRTC Robustness (Fixes null_rate)
**Problem**: RTCPeerConnection can fail in some browsers
**Solution**: Added availability check and graceful fallback
```javascript
if (typeof RTCPeerConnection === 'undefined') {
  return { available: false, sdp: 'unavailable', type: 'none' };
}
```

### 4. Determinism (Fixes fragmentation 0.4)
**Ensured**: No Math.random(), timestamps, performance.now, battery, network
**Hash**: Multi-pass FNV-1a (8 passes) producing 64-char hex
**Keys**: Always sorted with `Object.keys(signals).sort()`

### 5. CommonJS Compatibility
Added `module.exports` for Node.js/Docker environment:
```javascript
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runFingerprinting };
}
```

## Files Modified
- `fingerprinter.js`: Core fixes (storage, fonts, WebRTC, exports)
- `package.json`: Version bumped to 6.0.0
- `Dockerfile`: Unchanged (already correct)

## Submission Instructions
```bash
# Build Docker image
docker build -t taotickler/rt-dfp:v6 .

# Push to Docker Hub
docker push taotickler/rt-dfp:v6

# Get image hash
docker inspect taotickler/rt-dfp:v6 --format='{{index .RepoDigests 0}}'

# Submit to Bittensor
btcli s commit --netuid 61 --hash <sha256_hash>
```

## Target Metrics
- null_rate: <0.1 (was 0.5-0.83)
- collision: 0 (was 0.25)
- fragmentation: 0 (was 0.4)
- Score: 0.8+ (was 0)

## Testing
Test in private/incognito mode across:
- Chrome
- Brave
- Firefox Focus
- DuckDuckGo
- Safari

All should produce identical 64-char hex hashes.