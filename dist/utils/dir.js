import fs from 'node:fs';
import path from 'node:path';
/**
 * Risolve la root del progetto Firebase risalendo le cartelle a partire da process.cwd().
 * Condizioni per essere considerata root:
 * - esiste firebase.json
 * - esiste package.json
 * - esiste la cartella functions
 *
 * Sicurezza anti-loop:
 * - si ferma quando parent === current (root del filesystem)
 * - ha un maxDepth failsafe
 */
export function getProjectRoot(startDir = process.cwd(), maxDepth = 5) {
    let current = path.resolve(startDir);
    let depth = 0;
    while (depth < maxDepth) {
        const hasFirebaseJson = fs.existsSync(path.join(current, 'firebase.json'));
        const hasPackageJson = fs.existsSync(path.join(current, 'package.json'));
        const hasFunctionsDir = isDir(path.join(current, 'functions'));
        if (hasFirebaseJson && hasPackageJson && hasFunctionsDir) {
            return current;
        }
        const parent = path.dirname(current);
        // ✅ anti-loop: siamo arrivati in cima al filesystem
        if (parent === current)
            break;
        current = parent;
        depth++;
    }
    throw new Error('❌ Project root not found. Expected firebase.json + package.json + functions/ in the same directory. ' +
        `Start dir: ${startDir}`);
}
/**
 * Restituisce un path assoluto relativo alla root del progetto (risolta automaticamente).
 * Esempio: projectPath('functions', '.secret.local')
 */
export function projectPath(...segments) {
    const root = getProjectRoot();
    return path.join(root, ...segments);
}
/**
 * Verifica che un percorso esista ed è una directory.
 */
export function isDir(dirPath) {
    try {
        return fs.statSync(dirPath).isDirectory();
    }
    catch {
        return false;
    }
}
/**
 * Verifica che un percorso esista ed è un file.
 */
export function isFile(filePath) {
    try {
        return fs.statSync(filePath).isFile();
    }
    catch {
        return false;
    }
}
/**
 * Controllo generico: assicura che esista una directory.
 * Lancia errore con messaggio chiaro se manca.
 */
export function ensureDirExists(dirPath, label) {
    if (!isDir(dirPath)) {
        throw new Error(`❌ Directory not found: ${label ?? dirPath}`);
    }
}
/**
 * Controllo generico: assicura che esista un file.
 * Lancia errore con messaggio chiaro se manca.
 */
export function ensureFileExists(filePath, label) {
    if (!isFile(filePath)) {
        throw new Error(`❌ File not found: ${label ?? filePath}`);
    }
}
/**
 * Utility: crea un file vuoto se non esiste (senza sovrascrivere).
 * Utile per `.secret.local` al primo avvio.
 */
export function ensureFile(filePath, initialContent = '') {
    if (!fs.existsSync(filePath)) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, initialContent, 'utf8');
    }
}
/**
 * Bootstrap “coerente” per la CLI:
 * - valida di essere dentro un progetto Firebase (root detection)
 * - valida che esista functions/
 * - valida che esista secret.ts (obbligatorio per la tua CLI)
 * - crea .secret.local se manca
 *
 * Ritorna i path risolti così li puoi usare subito.
 */
export function bootstrapProjectFs() {
    const rootDir = getProjectRoot();
    const functionsDir = path.join(rootDir, 'functions');
    const secretLocalFile = path.join(functionsDir, '.secret.local');
    const secretTsFile = path.join(functionsDir, 'src', 'config', 'secret.ts');
    ensureDirExists(functionsDir, 'functions/');
    ensureFileExists(path.join(rootDir, 'firebase.json'), 'firebase.json');
    ensureFileExists(path.join(rootDir, 'package.json'), 'package.json');
    // per la tua CLI: secret.ts deve esistere
    ensureFileExists(secretTsFile, 'functions/src/config/secret.ts');
    // .secret.local può essere creato automaticamente
    ensureFile(secretLocalFile, '');
    return { rootDir, functionsDir, secretLocalFile, secretTsFile };
}
/**
 * Controlla che una lista di path (file o directory) esista.
 * NON crea nulla.
 *
 * Ritorna:
 * - existing: path trovati
 * - missing: path mancanti
 */
export function checkPathsExist(paths) {
    const existing = [];
    const missing = [];
    for (const p of paths) {
        if (fs.existsSync(p)) {
            existing.push(p);
        }
        else {
            missing.push(p);
        }
    }
    return { existing, missing };
}
/**
 * Controlla che una lista di path (file o directory) esista, ma se manca qualcosa lancia errore (fail-fast).
 */
export function assertPathsExist(paths) {
    const { missing } = checkPathsExist(paths);
    if (missing.length > 0) {
        throw new Error('❌ Missing required paths:\n' +
            missing.map((p) => ` - ${p}`).join('\n'));
    }
}
//# sourceMappingURL=dir.js.map