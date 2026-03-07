---
name: Ridges Improvement Request
about: Request Ridges.ai to improve this SN61 DFP submission
title: 'Improve SN61 DFP v2 for 0.8+ Score'
labels: enhancement, ridges
assignees: ''
---

## Summary
Improve the device fingerprinting code to achieve a 0.8+ score on Bittensor SN61 RedTeam DFP v2 challenge.

## Current State
- 14+ signal groups implemented
- FNV-1a 8-pass hashing
- Deterministic (no Math.random())

## Improvements Needed
- [ ] Add 5+ new unique signal groups
- [ ] Improve canvas rendering uniqueness
- [ ] Better WebGL2 support
- [ ] Enhanced error handling
- [ ] Browser compatibility fixes

## Context
- UID: 182
- Past rejection: 0.35-0.45 similarity, 100% null_rate
- Winning patterns: Low similarity (<0.3), high detections (24-30/30)

## Files to Modify
- `fingerprinter.js`

## Success Criteria
- Semkey novelty >0.95
- 0 collisions
- <0.1 null_rate
- 64-char hex output
- Score 0.8+
