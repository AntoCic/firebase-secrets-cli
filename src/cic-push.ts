#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'

import { ensureFileExists, getProjectRoot } from './utils/dir.js'
import { colorizer } from './utils/logger.js'

function safeCommitMessage(version: string, description: string) {
    // evita di rompere il comando git con doppi apici o newline
    const clean = description.replace(/\s+/g, ' ').trim().replace(/"/g, '\\"')
    return `v${version} – ${clean}`
}

async function askLine(question: string): Promise<string> {
    const rl = createInterface({ input, output })
    try {
        const ans = await rl.question(question)
        return ans ?? ''
    } finally {
        await rl.close()
    }
}

async function askYesNo(question: string, defaultYes = true): Promise<boolean> {
    const suffix = defaultYes ? '(s)' : '(n)'
    const raw = await askLine(`${question} [s/n] ${suffix}: `)
    const v = raw.trim().toLowerCase()

    if (!v) return defaultYes
    if (v.startsWith('n')) return false
    return true
}

function prependChangelog(changelogPath: string, entry: string) {
    let existing = ''
    if (fs.existsSync(changelogPath)) {
        existing = fs.readFileSync(changelogPath, 'utf8')
    }
    fs.writeFileSync(changelogPath, entry + existing, 'utf8')
}

function runGit(cmd: string, cwd: string) {
    execSync(cmd, { stdio: 'inherit', cwd })
}

async function main() {
    const rootDir = getProjectRoot()
    const packageJsonPath = path.join(rootDir, 'package.json')
    const changelogPath = path.join(rootDir, 'CHANGELOG.md')

    ensureFileExists(packageJsonPath, 'package.json')

    let pkg: any
    try {
        pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
    } catch {
        throw new Error(`❌ package.json is not valid JSON: ${packageJsonPath}`)
    }

    const version = pkg?.version
    if (!version || typeof version !== 'string') {
        throw new Error(`❌ package.json has no valid "version" field: ${packageJsonPath}`)
    }

    console.log(`${colorizer('▶', 'cyan')} Project root: ${colorizer(rootDir, 'magenta')}`)
    console.log(`${colorizer('▶', 'cyan')} Version: ${colorizer(version, 'magenta')}`)

    const descriptionRaw = await askLine('✏️  Descrizione per il changelog (invio per saltare): ')
    const hasDescription = descriptionRaw.trim().length > 0
    const description = hasDescription ? descriptionRaw.trim() : 'Nessuna descrizione fornita.'

    const today = new Date().toISOString().slice(0, 10)
    const entry = `## v${version} - ${today}

${description}

---

`

    prependChangelog(changelogPath, entry)
    console.log(`${colorizer('📝', 'green')} Changelog aggiornato: ${colorizer(changelogPath, 'magenta')}`)

    if (!hasDescription) {
        console.log(`${colorizer('⏭', 'yellow')} Nessuna descrizione: salto commit/tag/push Git`)
        console.log(`${colorizer('✔', 'green')} cic-push completato`)
        return
    }

    const doCommit = await askYesNo('📦 Vuoi fare il commit su Git?', true)
    if (!doCommit) {
        console.log(`${colorizer('😣', 'yellow')} Commit Git saltato`)
        console.log(`${colorizer('✔', 'green')} cic-push completato`)
        return
    }

    // Git actions
    try {
        console.log(`${colorizer('🔧', 'cyan')} git add .`)
        runGit('git add .', rootDir)

        const commitMsg = safeCommitMessage(version, description)
        console.log(`${colorizer('🔧', 'cyan')} git commit -m "${commitMsg}"`)
        runGit(`git commit -m "${commitMsg}"`, rootDir)

        console.log(`${colorizer('🔖', 'cyan')} git tag v${version}`)
        runGit(`git tag v${version}`, rootDir)

        const doPush = await askYesNo('🚀 Vuoi anche fare git push?', true)
        if (doPush) {
            console.log(`${colorizer('🚀', 'cyan')} git push`)
            runGit('git push', rootDir)

            console.log(`${colorizer('🚀', 'cyan')} git push --tags`)
            runGit('git push --tags', rootDir)

            console.log(`${colorizer('🚀', 'green')} Push completato!`)
        } else {
            console.log(`${colorizer('⏭', 'yellow')} Push saltato`)
        }
    } catch (err: any) {
        throw new Error(`❌ Errore durante operazioni Git: ${err?.message ?? err}`)
    }

    console.log(`${colorizer('✔', 'green')} cic-push completato`)
}

// entrypoint
main().catch((err) => {
    console.error(err?.message ?? err)
    process.exit(1)
})
