import { runWithStdin } from './run.js';
export async function setSecretOnline(key, val) {
    await runWithStdin(`firebase functions:secrets:set ${key}`, `${val}\n`);
}
//# sourceMappingURL=firebaseSecretCli.js.map