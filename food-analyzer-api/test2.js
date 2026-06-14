import fs from 'fs';
const pkg = JSON.parse(fs.readFileSync('./node_modules/ai/package.json', 'utf8'));
console.log('ai version:', pkg.version);
