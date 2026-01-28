import { projectPath } from "./dir.js"

/**
 * Path assoluto a functions/.secret.local (robusto: non dipende da process.cwd()).
 */
export const SECRET_LOCAL_FILE = projectPath('functions', '.secret.local')

/**
 * Path assoluto a functions/src/config/secret.ts (robusto: non dipende da process.cwd()).
 */
export const SECRET_TS_FILE = projectPath('functions', 'src', 'config', 'secret.ts')

/**
 * Path assoluto alla cartella functions/ (robusto: non dipende da process.cwd()).
 */
export const FUNCTIONS_DIR = projectPath('functions')

