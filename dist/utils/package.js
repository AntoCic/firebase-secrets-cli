import fs from 'node:fs';
import path from 'node:path';
/**
 * Incrementa la versione del package.json del progetto corrente.
 * Default: patch
 *
 * @returns newVersion
 */
export function bumpPackageVersion(type = 'patch', packageJsonPath = path.resolve(process.cwd(), 'package.json')) {
    if (!fs.existsSync(packageJsonPath)) {
        throw new Error(`package.json non trovato: ${packageJsonPath}`);
    }
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    if (typeof packageJson.version !== 'string') {
        throw new Error('Campo "version" mancante o non valido in package.json');
    }
    const parts = packageJson.version.split('.').map(Number);
    if (parts.length !== 3 || parts.some(Number.isNaN)) {
        throw new Error(`Versione non valida in package.json: "${packageJson.version}" (attesa x.y.z)`);
    }
    const [major, minor, patch] = parts;
    let next;
    if (type === 'major')
        next = [major + 1, 0, 0];
    else if (type === 'minor')
        next = [major, minor + 1, 0];
    else
        next = [major, minor, patch + 1];
    const newVersion = next.join('.');
    packageJson.version = newVersion;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');
    return newVersion;
}
//# sourceMappingURL=package.js.map