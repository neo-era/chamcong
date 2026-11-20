// Chạy toàn bộ test Node: node tests/node/run.js
'use strict';
const fs = require('fs');
const path = require('path');
let dat = 0, truot = 0;
for (const f of fs.readdirSync(__dirname).filter(f => /^test-.*\.js$/.test(f)).sort()) {
  console.log('\n# ' + f);
  for (const t of require(path.join(__dirname, f))) {
    try { t.fn(); dat++; console.log('  ✓ ' + t.ten); }
    catch (e) { truot++; console.log('  ✗ ' + t.ten + '\n      ' + String(e.message).split('\n')[0]); }
  }
}
console.log(`\nKết quả: ${dat} đạt, ${truot} trượt`);
process.exit(truot ? 1 : 0);
