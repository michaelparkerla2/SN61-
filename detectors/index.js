/**
 * RedTeam ADA v2 Detection Files - Index
 * 
 * This module exports all 10 detection strategies for the ADA challenge.
 * Each detector is a self-contained function that returns the detected framework.
 */

const fs = require('fs');
const path = require('path');

// Load all detector files
const detectors = {};
const detectorDir = __dirname;

// Read all detector files
for (let i = 1; i <= 10; i++) {
  const filename = `detector_${String(i).padStart(2, '0')}*.js`;
  const files = fs.readdirSync(detectorDir).filter(f => f.startsWith(`detector_${String(i).padStart(2, '0')}`));
  
  if (files.length > 0) {
    const filePath = path.join(detectorDir, files[0]);
    detectors[`detector${i}`] = {
      name: files[0],
      path: filePath,
      content: fs.readFileSync(filePath, 'utf-8')
    };
  }
}

// Export detector metadata
module.exports = {
  detectors,
  count: Object.keys(detectors).length,
  
  /**
   * Get all detector contents as an array
   */
  getAllDetectors() {
    return Object.values(detectors).map(d => d.content);
  },
  
  /**
   * Get detector by number (1-10)
   */
  getDetector(num) {
    return detectors[`detector${num}`]?.content;
  },
  
  /**
   * Framework targets for each detector
   */
  targets: {
    detector1: 'seleniumbase',
    detector2: 'selenium_driverless',
    detector3: 'nodriver',
    detector4: 'zendriver',
    detector5: 'puppeteer_extra',
    detector6: 'playwright',
    detector7: 'patchright',
    detector8: 'human',
    detector9: 'comprehensive (all)',
    detector10: 'fallback (all)'
  }
};