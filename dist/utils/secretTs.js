import fs from 'node:fs';
import path from 'node:path';
import { SECRET_TS_FILE } from './paths.js';
function ensureFileDir(filePath) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
}
export function parseExistingSecretKeysFromTs() {
    if (!fs.existsSync(SECRET_TS_FILE))
        return [];
    const content = fs.readFileSync(SECRET_TS_FILE, 'utf-8');
    const re = /^\s*([A-Z0-9_]+)\s*:\s*'([A-Z0-9_]+)'\s*,?\s*$/gm;
    const keys = new Set();
    let m;
    while ((m = re.exec(content)))
        keys.add(m[1]);
    return Array.from(keys);
}
export function writeSecretTs(keys) {
    ensureFileDir(SECRET_TS_FILE);
    const unique = Array.from(new Set(keys)).sort((a, b) => a.localeCompare(b));
    const lines = [
        '// functions/src/config/secret.ts',
        '',
        'export const secret = {',
        ...unique.map((k) => `    ${k}: '${k}',`),
        '} as const;',
        ''
    ];
    fs.writeFileSync(SECRET_TS_FILE, lines.join('\n'), 'utf-8');
}
export function removeSecretKeyFromTs(keys, keyToRemove) {
    return keys.filter((k) => k !== keyToRemove);
}
//# sourceMappingURL=secretTs.js.map