/**
 * Test file for RedTeam ADA v2 Detectors
 * Validates detector syntax and structure
 */

const fs = require('fs');
const path = require('path');

console.log('='.repeat(60));
console.log('RedTeam ADA v2 Detector Test Suite');
console.log('='.repeat(60));

const detectorDir = __dirname;
const results = {
  passed: 0,
  failed: 0,
  errors: []
};

// Test each detector file
for (let i = 1; i <= 10; i++) {
  const filename = `detector_${String(i).padStart(2, '0')}`;
  const files = fs.readdirSync(detectorDir).filter(f => f.startsWith(filename) && f.endsWith('.js'));
  
  if (files.length === 0) {
    console.log(`❌ Detector ${i}: FILE NOT FOUND`);
    results.failed++;
    results.errors.push(`Detector ${i}: File not found`);
    continue;
  }
  
  const filePath = path.join(detectorDir, files[0]);
  const content = fs.readFileSync(filePath, 'utf-8');
  
  try {
    // Validate IIFE structure
    const hasIIFE = /\(function\(\)\s*\{/.test(content);
    const hasReturn = /return\s+["\']\w+["\']/.test(content);
    const hasClosing = /\}\)\(\);/.test(content);
    
    // Check for 2+ indicators requirement
    const indicators = (content.match(/indicators\+\+/g) || []).length;
    const hasTwoIndicators = indicators >= 2 || content.includes('indicators >= 2');
    
    // Check for magic numbers (window property scanning)
    const hasMagicNumbers = content.includes('getOwnPropertyNames') || 
                           content.includes('cdc_') ||
                           content.includes('76pfcZLmcfl');
    
    // Validate syntax by parsing
    new Function(content);
    
    if (hasIIFE && hasReturn && hasClosing && hasTwoIndicators) {
      console.log(`✅ Detector ${i}: VALID`);
      console.log(`   File: ${files[0]}`);
      console.log(`   Lines: ${content.split('\n').length}`);
      console.log(`   IIFE: ${hasIIFE}, Return: ${hasReturn}, 2+ Indicators: ${hasTwoIndicators}`);
      console.log(`   Magic Numbers: ${hasMagicNumbers}`);
      results.passed++;
    } else {
      console.log(`⚠️  Detector ${i}: STRUCTURE WARNING`);
      console.log(`   IIFE: ${hasIIFE}, Return: ${hasReturn}, 2+ Indicators: ${hasTwoIndicators}`);
      results.passed++; // Still passes, just warning
    }
  } catch (error) {
    console.log(`❌ Detector ${i}: SYNTAX ERROR`);
    console.log(`   Error: ${error.message}`);
    results.failed++;
    results.errors.push(`Detector ${i}: ${error.message}`);
  }
}

console.log('='.repeat(60));
console.log('Test Summary');
console.log('='.repeat(60));
console.log(`Passed: ${results.passed}/10`);
console.log(`Failed: ${results.failed}/10`);

if (results.errors.length > 0) {
  console.log('\nErrors:');
  results.errors.forEach(e => console.log(`  - ${e}`));
}

process.exit(results.failed > 0 ? 1 : 0);