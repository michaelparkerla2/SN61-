/**
 * ADA Detection Framework Tests
 * 
 * Run these tests to verify detection logic
 * Note: These tests need to be run in actual browser environments
 * with the respective frameworks connected to validate detection.
 */

const ADAFrameworkDetector = require('./index');

// Test configuration
const TEST_CONFIG = {
  verbose: true,
  frameworks: [
    'puppeteer',
    'puppeteer_extra',
    'playwright',
    'patchright',
    'nodriver',
    'zendriver',
    'selenium_driverless',
    'seleniumbase',
    'webdriver',
    'websocket',
    'human'
  ]
};

/**
 * Run detection and log results
 */
function runDetectionTest() {
  console.log('=== ADA Framework Detection Test ===\n');
  
  const results = ADAFrameworkDetector.detectAll();
  const summary = ADAFrameworkDetector.getSummary();
  
  console.log('Stack Trace:');
  console.log(results.stack);
  console.log('\n');
  
  console.log('Detection Results:');
  console.log('------------------');
  
  for (const [framework, detected] of Object.entries(results)) {
    if (framework === 'stack') continue;
    const status = detected ? '✅ DETECTED' : '❌ not detected';
    console.log(`${framework.padEnd(20)} ${status}`);
  }
  
  console.log('\nSummary:');
  console.log('---------');
  console.log(`Detected frameworks: ${summary.detected.join(', ') || 'none'}`);
  console.log(`Total detected: ${summary.count}`);
  console.log(`Is bot: ${summary.isBot}`);
  
  // Check for critical issues
  console.log('\nCritical Checks:');
  console.log('----------------');
  
  // Check selenium detection (CRITICAL)
  const seleniumDetected = results.seleniumbase || results.selenium_driverless;
  console.log(`Selenium detected: ${seleniumDetected ? '✅' : '❌ CRITICAL - Score will be 0'}`);
  
  // Check human false positive
  const humanAndBot = results.human && summary.isBot;
  console.log(`Human false positive: ${humanAndBot ? '❌ CRITICAL' : '✅ OK'}`);
  
  // Check protocol checks
  const protocolChecks = results.webdriver || results.websocket;
  console.log(`Protocol checks: ${protocolChecks ? '✅' : '⚠️ WARNING'}`);
  
  return { results, summary };
}

/**
 * Validate detection against expected framework
 */
function validateDetection(expectedFramework) {
  const results = ADAFrameworkDetector.detectAll();
  const detected = results[expectedFramework];
  
  console.log(`\nValidation: Expected ${expectedFramework}`);
  console.log(`Result: ${detected ? '✅ CORRECT' : '❌ FAILED'}`);
  
  // Check for false positives
  const falsePositives = [];
  for (const [fw, isDetected] of Object.entries(results)) {
    if (fw === expectedFramework || fw === 'stack') continue;
    if (isDetected) {
      falsePositives.push(fw);
    }
  }
  
  if (falsePositives.length > 0) {
    console.log(`⚠️ False positives detected: ${falsePositives.join(', ')}`);
  }
  
  return {
    expected: expectedFramework,
    detected: detected,
    falsePositives,
    passed: detected && falsePositives.length === 0
  };
}

/**
 * Run all validation tests
 */
function runAllValidations() {
  console.log('=== Running All Validations ===\n');
  
  const validations = [];
  
  for (const framework of TEST_CONFIG.frameworks) {
    const result = validateDetection(framework);
    validations.push(result);
  }
  
  console.log('\n=== Validation Summary ===');
  const passed = validations.filter(v => v.passed).length;
  const failed = validations.filter(v => !v.passed).length;
  
  console.log(`Passed: ${passed}/${validations.length}`);
  console.log(`Failed: ${failed}/${validations.length}`);
  
  if (failed > 0) {
    console.log('\nFailed validations:');
    validations
      .filter(v => !v.passed)
      .forEach(v => {
        console.log(`  - ${v.expected}: ${v.detected ? 'detected' : 'NOT detected'}, false positives: ${v.falsePositives.join(', ') || 'none'}`);
      });
  }
  
  return validations;
}

// Export test functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runDetectionTest,
    validateDetection,
    runAllValidations,
    TEST_CONFIG
  };
}

// Run tests if executed directly
if (require.main === module) {
  runDetectionTest();
}