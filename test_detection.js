// Quick test of the detection module
const ADAFrameworkDetector = require('./detection/index.js');

console.log('=== ADA Detection Framework Test ===\n');

// Test basic functionality
console.log('Testing detection methods:');
console.log('getStack():', ADAFrameworkDetector.getStack().substring(0, 100) + '...');
console.log('isBrowser():', ADAFrameworkDetector.isBrowser());

// Test individual detections
console.log('\nIndividual detections:');
console.log('detectPuppeteer():', ADAFrameworkDetector.detectPuppeteer());
console.log('detectPlaywright():', ADAFrameworkDetector.detectPlaywright());
console.log('detectWebdriver():', ADAFrameworkDetector.detectWebdriver());

// Test full detection
console.log('\nFull detection results:');
const results = ADAFrameworkDetector.detectAll();
console.log('Frameworks detected:', Object.entries(results)
  .filter(([k, v]) => k !== 'stack' && v === true)
  .map(([k]) => k));

// Test summary
console.log('\nSummary:');
const summary = ADAFrameworkDetector.getSummary();
console.log('Detected count:', summary.count);
console.log('Is bot:', summary.isBot);

console.log('\n✅ Detection module loaded successfully!');