import fs from 'node:fs';
import path from 'node:path';
/**
 * Cerca la root del progetto risalendo le cartelle e fermandosi in modo sicuro:
 * - si ferma quando parent === current (root del filesystem)
 * - maxDepth evita qualunque loop “strano”
 *
 * Per l'init NON richiediamo functions/ (perché potremmo doverla creare),
 * ma richiediamo almeno:
 * - firebase.json
 * - package.json
 */
function findProjectRootForInit(startDir = process.cwd(), maxDepth = 10) {
    let current = path.resolve(startDir);
    let depth = 0;
    while (depth < maxDepth) {
        const hasFirebaseJson = fs.existsSync(path.join(current, 'firebase.json'));
        const hasPackageJson = fs.existsSync(path.join(current, 'package.json'));
        if (hasFirebaseJson && hasPackageJson)
            return current;
        const parent = path.dirname(current);
        if (parent === current)
            break;
        current = parent;
        depth++;
    }
    throw new Error('❌ Project root not found for init. Expected firebase.json + package.json in the same directory (somewhere above).\n' +
        `Start dir: ${startDir}`);
}
/**
 * Crea una directory se non esiste (recursive).
 * Se esiste già, non fa nulla.
 */
function ensureDir(dirPath, created, alreadyExists) {
    if (fs.existsSync(dirPath)) {
        alreadyExists.push(dirPath);
        return;
    }
    fs.mkdirSync(dirPath, { recursive: true });
    created.push(dirPath);
}
/**
 * Crea un file SOLO se non esiste.
 * - se serve, crea anche la directory padre
 * - non sovrascrive mai
 */
function ensureFile(filePath, content, created, alreadyExists) {
    if (fs.existsSync(filePath)) {
        alreadyExists.push(filePath);
        return;
    }
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf8');
    created.push(filePath);
}
/**
 * Inizializza i file/cartelle minimi per la Firebase Secrets CLI.
 * Cosa fa:
 * - trova la root (firebase.json + package.json)
 * - crea functions/ se manca
 * - crea functions/.secret.local se manca (vuoto)
 * - crea functions/src/config/secret.ts se manca (template con oggetto vuoto coerente con secretTs.ts)
 *
 * NON sovrascrive nulla se esiste già.
 */
export function initFirebaseSecretsProject(startDir = process.cwd()) {
    const rootDir = findProjectRootForInit(startDir);
    const created = [];
    const alreadyExists = [];
    const functionsDir = path.join(rootDir, 'functions');
    const secretLocalFile = path.join(functionsDir, '.secret.local');
    const secretTsFile = path.join(functionsDir, 'src', 'config', 'secret.ts');
    // 1) functions/
    ensureDir(functionsDir, created, alreadyExists);
    // 2) .secret.local (vuoto)
    ensureFile(secretLocalFile, '', created, alreadyExists);
    // 3) secret.ts (template coerente con parseExistingSecretKeysFromTs / writeSecretTs)
    const secretTsTemplate = [
        '// functions/src/config/secret.ts',
        '',
        'export const secret = {',
        '} as const;',
        ''
    ].join('\n');
    ensureFile(secretTsFile, secretTsTemplate, created, alreadyExists);
    return { rootDir, created, alreadyExists };
}
//# sourceMappingURL=init.js.map