import { runWithStdin } from './run.js'

export async function setSecretOnline(key: string, val: string): Promise<void> {
    await runWithStdin(`firebase functions:secrets:set ${key}`, `${val}\n`)
}
