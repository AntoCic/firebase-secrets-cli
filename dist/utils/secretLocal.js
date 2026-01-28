import fs from 'node:fs';
import path from 'node:path';
import { SECRET_LOCAL_FILE } from './paths.js';
function ensureFileDir(filePath) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
}
function readLines(filePath) {
    if (!fs.existsSync(filePath))
        return [];
    return fs
        .readFileSync(filePath, 'utf-8')
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
}
export function upsertSecretLocalKey(key) {
    ensureFileDir(SECRET_LOCAL_FILE);
    const lines = readLines(SECRET_LOCAL_FILE);
    const filtered = lines.filter((l) => !l.startsWith(`${key}=`));
    filtered.push(`${key}=`); // solo KEY=
    filtered.sort((a, b) => a.localeCompare(b));
    fs.writeFileSync(SECRET_LOCAL_FILE, filtered.join('\n') + '\n', 'utf-8');
}
export function commentSecretLocalKey(key) {
    ensureFileDir(SECRET_LOCAL_FILE);
    const lines = readLines(SECRET_LOCAL_FILE);
    const keyRegex = new RegExp(`^\\s*#?\\s*${key}=.*$`);
    const updated = lines.map((line) => {
        if (!keyRegex.test(line))
            return line;
        const trimmed = line.trim();
        // già commentata → normalizza solo lo spazio
        if (trimmed.startsWith('#')) {
            return `# ${trimmed.replace(/^#+\s*/, '')}`;
        }
        // non commentata → commenta mantenendo valore
        return `# ${trimmed}`;
    });
    fs.writeFileSync(SECRET_LOCAL_FILE, updated.join('\n'), 'utf-8');
}
export function upsertSecretLocalKeyValue(key, value) {
    ensureFileDir(SECRET_LOCAL_FILE);
    const lines = readLines(SECRET_LOCAL_FILE);
    const rx = new RegExp(`^\\s*(#\\s*)?${key}=.*$`);
    let found = false;
    const updated = lines.map((line) => {
        if (!rx.test(line))
            return line;
        found = true;
        return `${key}=${value}`; // decommenta + set value
    });
    if (!found)
        updated.push(`${key}=${value}`);
    // opzionale: stabilità del file
    const normalized = updated
        .map((l) => l.trimEnd())
        .filter((l) => l.length > 0);
    fs.writeFileSync(SECRET_LOCAL_FILE, normalized.join('\n') + '\n', 'utf-8');
}
export function listCommentedSecretsWithValue() {
    ensureFileDir(SECRET_LOCAL_FILE);
    const lines = readLines(SECRET_LOCAL_FILE);
    const out = [];
    for (const line of lines) {
        const trimmed = line.trim();
        // Solo commentate
        if (!trimmed.startsWith('#'))
            continue;
        // rimuovi il commento: "#", "# ", "##  " ecc.
        const uncommented = trimmed.replace(/^#+\s*/, '');
        const eq = uncommented.indexOf('=');
        if (eq <= 0)
            continue;
        const key = uncommented.slice(0, eq).trim();
        const value = uncommented.slice(eq + 1);
        if (!key)
            continue;
        if (value.trim().length === 0)
            continue; // value non deve essere solo spazi
        out.push({ key, value: value.trim() });
    }
    // dedup: ultima occorrenza vince
    const map = new Map();
    for (const item of out)
        map.set(item.key, item.value);
    return Array.from(map.entries())
        .map(([key, value]) => ({ key, value }))
        .sort((a, b) => a.key.localeCompare(b.key));
}
export function uncommentAndSetSecretLocal(key, value) {
    ensureFileDir(SECRET_LOCAL_FILE);
    const lines = readLines(SECRET_LOCAL_FILE);
    const rx = new RegExp(`^\\s*(#\\s*)?${key}=.*$`);
    let found = false;
    const updated = lines.map((line) => {
        if (!rx.test(line))
            return line;
        found = true;
        return `${key}=${value}`; // decommenta + set value (preserva value)
    });
    if (!found)
        updated.push(`${key}=${value}`);
    fs.writeFileSync(SECRET_LOCAL_FILE, updated.join('\n') + '\n', 'utf-8');
}
//# sourceMappingURL=secretLocal.js.map