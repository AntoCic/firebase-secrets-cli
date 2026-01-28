#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const packageJsonPath = path.resolve(__dirname, '..', 'package.json')

const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

if (!pkg.version) {
    throw new Error('package.json non contiene la chiave "version"')
}

const parts = pkg.version.split('.').map(Number)

if (parts.length !== 3 || parts.some(isNaN)) {
    throw new Error(`Versione non valida: ${pkg.version}`)
}

// bump patch
parts[2] += 1
pkg.version = parts.join('.')

fs.writeFileSync(
    packageJsonPath,
    JSON.stringify(pkg, null, 2) + '\n',
    'utf8'
)

console.log(`✔ Version bumped to ${pkg.version}`)
