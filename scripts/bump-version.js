// scripts/bump-version.js
// Increments the patch version in package.json and writes back.
const fs = require('fs');
const path = require('path');

const pkgPath = path.resolve(__dirname, '..', 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

function incrementPatch(version) {
  const parts = version.split('.');
  if (parts.length !== 3) return version;
  const patch = parseInt(parts[2], 10) + 1;
  return `${parts[0]}.${parts[1]}.${patch}`;
}

const oldVersion = pkg.version;
const newVersion = incrementPatch(oldVersion);
pkg.version = newVersion;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
console.log(`Version bumped: ${oldVersion} → ${newVersion}`);
