#!/usr/bin/env node

import select from '@inquirer/select'
import inquirer from 'inquirer'
import { initFirebaseSecretsProject } from './utils/init.js'
import { colorizer } from './utils/logger.js'

type Action =
    | 'init'
    | 'firebase-secrets'
    | 'bump'
    | 'push'
    | 'exit'

async function main() {
    console.log('✔ cic CLI')

    const action = await select<Action>({
        message: 'Menu',
        choices: [
            { name: 'Init (Firebase Secrets)', value: 'init' },
            { name: 'Firebase Secrets Manager', value: 'firebase-secrets' },
            { name: 'Bump version (package.json)', value: 'bump' },
            { name: 'Push (changelog + git)', value: 'push' },
            { name: 'Exit', value: 'exit' },
        ],
    })

    if (action === 'init') {
        const { ok } = await inquirer.prompt<{ ok: boolean }>([
            {
                type: 'confirm',
                name: 'ok',
                message:
                    'Questa operazione creerà (solo se mancanti) functions/, functions/.secret.local e functions/src/config/secret.ts. Vuoi continuare?',
                default: false,
            },
        ])
        if (!ok) { console.log('annullato'); return; }
        const res = initFirebaseSecretsProject()
        console.log('\n✔ Init completato')
        console.log('Root:', res.rootDir)
        if (res.created.length) {
            console.log('\nCreati:')
            for (const p of res.created) console.log(' +', p)
        }
        if (res.alreadyExists.length) {
            console.log('\nGià esistenti (non toccati):')
            for (const p of res.alreadyExists) console.log(' =', p)
        }
        return
    }

    if (action === 'firebase-secrets') {
        await import('./firebase-secrets.js'); return;// comportamento voluto
    }

    if (action === 'bump') {
        await import('./cic-bump.js'); return;
    }

    if (action === 'push') {
        await import('./cic-push.js'); return;
    }

    console.log(`${colorizer('A presto!', 'brightGreen')} 👋`)
}

main().catch((err) => { console.error('❌ Errore:', err instanceof Error ? err.message : err); process.exit(1); })
