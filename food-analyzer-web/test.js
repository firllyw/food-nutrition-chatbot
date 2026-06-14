const fs = require('fs');
const content = fs.readFileSync('node_modules/ai/dist/index.d.ts', 'utf8');
const match = content.match(/type ChatInit[\s\S]*?}/m);
console.log(match ? match[0] : 'Not found');
