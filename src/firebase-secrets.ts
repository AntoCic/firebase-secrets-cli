#!/usr/bin/env tsx

import select from '@inquirer/select'
import inquirer from 'inquirer'

import { run, runCapture } from './utils/run.js'
import { setSecretOnline } from './utils/firebaseSecretCli.js'
import { upsertSecretLocalKey, commentSecretLocalKey, upsertSecretLocalKeyValue, listCommentedSecretsWithValue, uncommentAndSetSecretLocal } from './utils/secretLocal.js'
import { parseExistingSecretKeysFromTs, writeSecretTs, removeSecretKeyFromTs } from './utils/secretTs.js'
import { pickSecretKey } from './utils/secretKeyPicker.js'
import { hr, hrLight, coloredSecretKV } from './utils/logger.js'
import { assertPathsExist } from './utils/dir.js'
import { FUNCTIONS_DIR, SECRET_TS_FILE } from './utils/paths.js'

type CommandKey = 'get' | 'list' | 'set' | 'update' | 'destroy' | 'syncToLocal' | 'reviveFromLocal' | 'exit'

const COMMANDS: Record<CommandKey, string> = {
    get: 'Vedere il valore di una variabile (secret)',
    list: 'Vedere tutte le variabili (secrets)',
    set: 'Scrivere una variabile (secret)',
    update: 'Aggiornare una variabile (secret)',
    destroy: 'Eliminare una variabile (secret)',
    syncToLocal: 'Allinea una key ONLINE in .secret.local',
    reviveFromLocal: 'Revive da .secret.local (commentate con valore)',
    exit: 'Esci'
}

async function main() {
    // ✅ fail-fast: se manca qualcosa, errore ed exit subito
    try {
        assertPathsExist([SECRET_TS_FILE, FUNCTIONS_DIR])
    } catch (err) {
        console.error('\n' + (err as Error).message)
        process.exit(1)
    }

    while (true) {
        const cmd = await select<CommandKey>({
            message: 'Firebase Secrets Manager',
            choices: (Object.keys(COMMANDS) as CommandKey[]).map((key) => ({
                name: COMMANDS[key],
                value: key
            }))
        })

        if (cmd === 'exit') process.exit(0)

        try {

            if (cmd === 'get') {
                const keys = parseExistingSecretKeysFromTs()

                const key = await pickSecretKey({
                    message: 'Seleziona la secret da visualizzare',
                    keys,
                    otherLabel: 'Other… (scrivi a mano)'
                })

                hrLight();
                const value = await runCapture(`firebase functions:secrets:access ${key}`, `Carico ${key}`)
                console.log(coloredSecretKV(key, value))
                hr();
                continue
            }

            if (cmd === 'list') {
                const { ok } = await inquirer.prompt<{ ok: boolean }>([
                    {
                        type: 'confirm',
                        name: 'ok',
                        message: 'Attenzione: verranno mostrati a schermo i VALORI dei secrets. Vuoi continuare?',
                        default: false
                    }
                ])
                if (!ok) continue

                const keys = parseExistingSecretKeysFromTs().sort((a, b) => a.localeCompare(b))

                hrLight();
                for (const key of keys) {
                    const value = await runCapture(`firebase functions:secrets:access ${key}`, `Carico ${key}`)
                    console.log(coloredSecretKV(key, value))
                }

                console.log('\n✔ Fine lista secrets');
                hr();
                continue
            }

            if (cmd === 'set') {
                const { name } = await inquirer.prompt<{ name: string }>([
                    { type: 'input', name: 'name', message: 'Nome secret', validate: (v) => !!v.trim() || 'Obbligatorio' }
                ])

                const { value } = await inquirer.prompt<{ value: string }>([
                    { type: 'password', name: 'value', message: 'Valore secret', mask: '*', validate: (v) => !!v.trim() || 'Obbligatorio' }
                ])

                const key = name.trim()
                const val = value.trim()

                hrLight();
                // 1) online first
                await setSecretOnline(key, val)

                // 2) local files
                upsertSecretLocalKey(key)
                const existing = parseExistingSecretKeysFromTs()
                writeSecretTs([...existing, key])

                console.log(`\n✔ Secret "${key}" salvata online + aggiornata .secret.local + secret.ts`)
                hr();
                continue
            }

            if (cmd === 'update') {
                const keys = parseExistingSecretKeysFromTs()

                const key = await pickSecretKey({
                    message: 'Seleziona la secret da aggiornare',
                    keys,
                    otherLabel: 'Other… (scrivi a mano)'
                })

                const { value } = await inquirer.prompt<{ value: string }>([
                    { type: 'password', name: 'value', message: `Nuovo valore per ${key}`, mask: '*', validate: (v) => !!v.trim() || 'Obbligatorio' }
                ])

                const val = value.trim()

                hrLight()

                // 1) online first
                await setSecretOnline(key, val)

                // 2) local files
                upsertSecretLocalKey(key) // mantiene KEY= (se era commentata la lascia commentata: ok per set/update)
                const existing = parseExistingSecretKeysFromTs()
                writeSecretTs([...existing, key])

                console.log(`\n✔ Secret "${key}" aggiornata online + aggiornata .secret.local + secret.ts`)
                hr()
                continue
            }

            if (cmd === 'destroy') {
                const keys = parseExistingSecretKeysFromTs()

                const key = await pickSecretKey({
                    message: 'Seleziona la secret da eliminare',
                    keys,
                    otherLabel: 'Other… (scrivi a mano)'
                })

                const { ok } = await inquirer.prompt<{ ok: boolean }>([
                    { type: 'confirm', name: 'ok', message: `Confermi eliminazione ONLINE di "${key}"?`, default: false }
                ])

                if (!ok) continue

                hrLight();
                // 1) elimina online senza ulteriore prompt Firebase
                await run(`firebase functions:secrets:destroy ${key} --force`)

                // 2) aggiorna files locali SOLO se online è andata a buon fine
                commentSecretLocalKey(key)

                const existing = parseExistingSecretKeysFromTs()
                const updated = removeSecretKeyFromTs(existing, key)
                writeSecretTs(updated)

                console.log(`\n✔ Secret "${key}" eliminata online + aggiornata .secret.local + secret.ts`)
                hr();
                continue
            }

            if (cmd === 'syncToLocal') {
                const keys = parseExistingSecretKeysFromTs()

                const key = await pickSecretKey({
                    message: 'Seleziona la secret da allineare in .secret.local',
                    keys,
                    otherLabel: 'Other… (scrivi a mano)'
                })

                hrLight()
                const value = await runCapture(`firebase functions:secrets:access ${key}`, `Carico ${key}`)

                upsertSecretLocalKeyValue(key, value)

                console.log(`\n✔ Allineata ${key} in functions/.secret.local`)
                hr()
                continue
            }

            if (cmd === 'reviveFromLocal') {
                const candidates = listCommentedSecretsWithValue()

                if (candidates.length === 0) {
                    console.log('\nℹ Nessuna secret commentata con valore trovata in functions/.secret.local')
                    hr()
                    continue
                }

                const key = await pickSecretKey({
                    message: 'Seleziona la secret da ripristinare (revive)',
                    keys: candidates.map((c) => c.key),
                    otherLabel: 'Other… (scrivi a mano)'
                })

                const found = candidates.find((c) => c.key === key)

                if (!found) {
                    console.log(`\n❌ La key "${key}" non è tra le commentate con valore in .secret.local`)
                    hr()
                    continue
                }

                hrLight()

                // 1) push online
                await setSecretOnline(key, found.value)

                // 1.5) aggiungi key a secret.ts
                const existing = parseExistingSecretKeysFromTs()
                writeSecretTs([...existing, key])

                // 2) decommenta + set value in .secret.local
                uncommentAndSetSecretLocal(key, found.value)

                console.log(`\n✔ Revive completato: ${coloredSecretKV(key, found.value)}`)
                hr()
                continue
            }

        } catch (err) {
            console.error('\n❌ Errore:', (err as Error).message)
        }
    }
}

main()
