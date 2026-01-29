#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const { createInterface } = require('readline/promises')
const { stdin: input, stdout: output } = require('process')

// root del PACCHETTO CLI (scripts/..)
const rootDir = path.resolve(__dirname, '..')
const packageJsonPath = path.join(rootDir, 'package.json')
const changelogPath = path.join(rootDir, 'CHANGELOG.md')

function colorizer(text, color) {
  // fallback minimale se non vuoi dipendere da utils/logger nel CJS
  // (se preferisci importare il tuo logger, dimmelo e lo adatto)
  const map = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
    gray: '\x1b[90m',
    brightGreen: '\x1b[92m',
    reset: '\x1b[0m',
  }
  const c = map[color] || ''
  return c ? `${c}${text}${map.reset}` : text
}

function ensureFileExists(filePath, label = 'file') {
  if (!fs.existsSync(filePath)) {
    throw new Error(`❌ ${label} non trovato: ${filePath}`)
  }
}

function safeCommitMessage(version, description) {
  const clean = String(description)
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/"/g, '\\"')
  return `v${version} – ${clean}`
}

async function askLine(question) {
  const rl = createInterface({ input, output })
  try {
    const ans = await rl.question(question)
    return ans ?? ''
  } finally {
    await rl.close()
  }
}

async function askYesNo(question, defaultYes = true) {
  const suffix = defaultYes ? '(s)' : '(n)'
  const raw = await askLine(`${question} [s/n] ${suffix}: `)
  const v = raw.trim().toLowerCase()

  if (!v) return defaultYes
  if (v.startsWith('n')) return false
  return true
}

function prependChangelog(entry) {
  let existing = ''
  if (fs.existsSync(changelogPath)) {
    existing = fs.readFileSync(changelogPath, 'utf8')
  }
  fs.writeFileSync(changelogPath, entry + existing, 'utf8')
}

function runGit(cmd) {
  execSync(cmd, { stdio: 'inherit', cwd: rootDir })
}

async function main() {
  console.log(`${colorizer('▶', 'cyan')} CLI package root: ${colorizer(rootDir, 'magenta')}`)

  ensureFileExists(packageJsonPath, 'package.json')

  let pkg
  try {
    pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
  } catch {
    throw new Error(`❌ package.json non è JSON valido: ${packageJsonPath}`)
  }

  const version = pkg && pkg.version
  if (!version || typeof version !== 'string') {
    throw new Error(`❌ package.json non contiene un campo "version" valido: ${packageJsonPath}`)
  }

  console.log(`${colorizer('▶', 'cyan')} Version: ${colorizer(version, 'magenta')}`)

  const descriptionRaw = await askLine('✏️  Descrizione per il changelog (invio per saltare): ')
  const hasDescription = descriptionRaw.trim().length > 0
  const description = hasDescription ? descriptionRaw.trim() : 'Nessuna descrizione fornita.'

  const today = new Date().toISOString().slice(0, 10)
  const entry = `## v${version} - ${today}

${description}

---

`

  prependChangelog(entry)
  console.log(`${colorizer('📝', 'green')} Changelog aggiornato: ${colorizer(changelogPath, 'magenta')}`)

  if (!hasDescription) {
    console.log(`${colorizer('⏭', 'yellow')} Nessuna descrizione: salto commit/tag/push Git`)
    console.log(`${colorizer('✔', 'green')} Processo git-push completato`)
    return
  }

  const doCommit = await askYesNo('📦 Vuoi fare il commit su Git?', true)
  if (!doCommit) {
    console.log(`${colorizer('😣', 'yellow')} Commit Git saltato`)
    console.log(`${colorizer('✔', 'green')} Processo git-push completato`)
    return
  }

  try {
    console.log(`${colorizer('🔧', 'cyan')} git add .`)
    runGit('git add .')

    const commitMsg = safeCommitMessage(version, description)
    console.log(`${colorizer('🔧', 'cyan')} git commit -m "${commitMsg}"`)
    runGit(`git commit -m "${commitMsg}"`)

    console.log(`${colorizer('🔖', 'cyan')} git tag v${version}`)
    runGit(`git tag v${version}`)

    const doPush = await askYesNo('🚀 Vuoi anche fare git push?', true)
    if (doPush) {
      console.log(`${colorizer('🚀', 'cyan')} git push`)
      runGit('git push')

      console.log(`${colorizer('🚀', 'cyan')} git push --tags`)
      runGit('git push --tags')

      console.log(`${colorizer('🚀', 'green')} Push completato!`)
    } else {
      console.log(`${colorizer('⏭', 'yellow')} Push saltato`)
    }
  } catch (err) {
    throw new Error(`❌ Errore durante operazioni Git: ${err && err.message ? err.message : String(err)}`)
  }

  console.log(`${colorizer('✔', 'green')} Processo git-push completato`)
}

main().catch((err) => {
  console.error(colorizer(err && err.message ? err.message : String(err), 'red'))
  process.exit(1)
})
