const fs = require('fs');
const assert = (c, m) => { if (!c) { console.error('FAIL:', m); process.exit(1); } console.log('PASS:', m); };
const src = fs.readFileSync('version.js', 'utf8');
assert(/E2E_VERSION=\{/.test(src), 'version.js exposes E2E_VERSION');
assert(/job:"/.test(src), 'version.js carries job field');
const html = fs.readFileSync('index.html', 'utf8');
assert(html.includes('Factory E2E Staging'), 'index.html present');
console.log('E2E_STAGING_TESTS_OK');
