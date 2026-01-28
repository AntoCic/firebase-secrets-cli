const RESET = '\x1b[0m'
const DIM = '\x1b[2m'

const COLORS = {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m',
    brightRed: '\x1b[91m',
    brightGreen: '\x1b[92m',
    brightYellow: '\x1b[93m',
    brightBlue: '\x1b[94m',
    brightMagenta: '\x1b[95m',
    brightCyan: '\x1b[96m',
    brightWhite: '\x1b[97m'
} as const

export type LogColor = keyof typeof COLORS

export function colorizer(text: string, color: LogColor, dim = false): string {
    const c = COLORS[color]
    const d = dim ? DIM : ''
    return `${d}${c}${text}${RESET}`
}

export function hrLight(color: LogColor = 'cyan'): void { console.log(colorizer('-----------------------------------------------', color)); }
export function hr(color: LogColor = 'cyan'): void { console.log(colorizer('===============================================', color)) }

export function coloredSecretKV(key: string, value: string): string {
    return `${colorizer(key, 'green')} ${colorizer('=', 'gray', true)} ${colorizer(value, 'magenta')}`
}