const fs = require('fs');
const content = fs.readFileSync('./sn61-dfp/fingerprinter.js', 'utf8');
console.log('File size:', content.length, 'characters');
console.log('\n=== FIRST 2000 CHARACTERS ===\n');
console.log(content.substring(0, 2000));
console.log('\n=== LAST 2000 CHARACTERS ===\n');
console.log(content.substring(content.length - 2000));