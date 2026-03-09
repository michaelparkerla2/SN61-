# SN61 RedTeam DFP v2 - Device Fingerprinter

[![Bittensor](https://img.shields.io/badge/Bittensor-SN61-blue)](https://bittensor.com)
[![UID](https://img.shields.io/badge/UID-182-green)](https://taostats.io)
[![Version](https://img.shields.io/badge/version-v5.0.0-orange)](https://github.com)

Deterministic device fingerprinting for Bittensor Subnet 61 (RedTeam by Innerworks).

## Features

- **14+ Signal Groups**: Screen, Navigator, WebGL, Canvas, Fonts, Math, Audio, Codecs, Emoji, Intl, Performance, Storage, Plugins, Touch, WebRTC
- **Deterministic**: No `Math.random()` - same device = same hash every time
- **FNV-1a Multi-Pass**: 8-pass hashing for stability and uniqueness
- **64-char Hex Output**: Standard format for DFP v2 challenge
- **0 Collisions Target**: Unique fingerprints across devices
- **<0.1 Null Rate**: Full browser coverage

## Quick Start

```bash
# Install dependencies
npm install

# Run locally
npm start

# Run tests
npm test
```

## Docker Build & Submit

```bash
# Build image
docker build -t taotickler/rt-dfp:v5 .

# Test locally
docker run --rm taotickler/rt-dfp:v5

# Push to Docker Hub
docker push taotickler/rt-dfp:v5

# Get image SHA256
docker inspect --format='{{index .RepoDigests 0}}' taotickler/rt-dfp:v5

# Submit to Bittensor SN61
btcli s commit --netuid 61 --hash <sha256_hash>
```

## Submission Checklist

- [ ] Run local tests (0 collisions, <0.1 null_rate)
- [ ] Verify Semkey novelty >0.95
- [ ] Build Docker image
- [ ] Test Docker locally
- [ ] Push to Docker Hub
- [ ] Get SHA256 hash
- [ ] Submit via btcli
- [ ] Wait 24h for key reveal
- [ ] Monitor on dashboard.theredteam.io

## Signal Groups

| # | Signal | Description | Stability |
|---|--------|-------------|-----------|
| 1 | Screen | Display properties (9 attributes) | High |
| 2 | Navigator | Browser/device info (20+ attributes) | High |
| 3 | WebGL | GPU/rendering params (30+ attributes) | High |
| 4 | Canvas | Rendered image hash | Medium-High |
| 5 | Fonts | Detected fonts (22x3 tests) | High |
| 6 | Math | Precision fingerprint (16 ops) | High |
| 7 | Audio | AudioContext fingerprint | Medium |
| 8 | Codecs | Supported media formats (16) | High |
| 9 | Emoji | Rendering width variations | Medium |
| 10 | Intl | Locale/timezone/formatting | High |
| 11 | Performance | Timing/memory metrics | Low |
| 12 | Storage | Available storage APIs | High |
| 13 | Plugins | Browser plugins | Medium |
| 14 | Touch | Touch capabilities | High |
| 15 | WebRTC | SDP fingerprint | Medium |

## Architecture

```
┌─────────────────────────────────────────┐
│           runFingerprinting()           │
├─────────────────────────────────────────┤
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐       │
│  │ Scr │ │ Nav │ │WebGL│ │ Can │ ...   │
│  └──┬──┘ └──┬──┘ └──┬──┘ └──┬──┘       │
│     └───────┴───────┴───────┘           │
│              ↓                          │
│     JSON.stringify(sorted)              │
│              ↓                          │
│     multiPassHash(8 passes)             │
│              ↓                          │
│     64-char hex fingerprint             │
└─────────────────────────────────────────┘
```

## Tools Integration

- **Semkey**: Pre-submit novelty check (>0.95)
- **Analog**: Orthogonal signal ideas
- **Crucible**: Multi-browser testing
- **FixForge**: Auto-repair from rejection logs
- **RedFeed**: Dashboard data for intel

## License

MIT - @bittensormax (UID 182)
