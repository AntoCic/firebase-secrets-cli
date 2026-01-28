#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { ensureFileExists, getProjectRoot } from './utils/dir.js'
import { colorizer } from './utils/logger.js'

function bumpPatch(version: string): string {
    const parts = version.split('.').map((n) => Number(n))

    if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
        throw new Error(`❌ Invalid version format in package.json: "${version}" (expected x.y.z)`)
    }

    parts[2] += 1
    return parts.join('.')
}

export function bumpRootPackageVersion(): string {
    const rootDir = getProjectRoot()
    const packageJsonPath = path.join(rootDir, 'package.json')

    ensureFileExists(packageJsonPath, 'package.json')

    const raw = fs.readFileSync(packageJsonPath, 'utf8')

    let pkg: any
    try {
        pkg = JSON.parse(raw)
    } catch {
        throw new Error(`❌ package.json is not valid JSON: ${packageJsonPath}`)
    }

    if (!pkg.version || typeof pkg.version !== 'string') {
        throw new Error(`❌ package.json has no valid "version" field: ${packageJsonPath}`)
    }

    const oldVersion = pkg.version
    const newVersion = bumpPatch(oldVersion)

    pkg.version = newVersion

    // mantiene formattazione standard (2 spazi) + newline finale
    fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8')

    return newVersion
}

// esecuzione diretta (cli entrypoint)
try {
    const v = bumpRootPackageVersion()
    console.log(`${colorizer('✔','green')} Root package.json version bumped to ${colorizer(v,'magenta')}`)
} catch (err: any) {
    console.error(err?.message ?? err)
    process.exit(1)
}
