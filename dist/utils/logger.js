const RESET = '\x1b[0m';
const DIM = '\x1b[2m';
const COLORS = {
    black: '\x1b[30m', // #000000
    red: '\x1b[31m', // #800000
    green: '\x1b[32m', // #008000
    yellow: '\x1b[33m', // #808000
    blue: '\x1b[34m', // #000080
    magenta: '\x1b[35m', // #800080
    cyan: '\x1b[36m', // #008080
    white: '\x1b[37m', // #c0c0c0
    gray: '\x1b[90m', // #808080
    brightRed: '\x1b[91m', // #ff0000
    brightGreen: '\x1b[92m', // #00ff00
    brightYellow: '\x1b[93m', // #ffff00
    brightBlue: '\x1b[94m', // #0000ff
    brightMagenta: '\x1b[95m', // #ff00ff
    brightCyan: '\x1b[96m', // #00ffff
    brightWhite: '\x1b[97m', // #ffffff
};
export function colorizer(text, color, dim = false) {
    const c = COLORS[color];
    const d = dim ? DIM : '';
    return `${d}${c}${text}${RESET}`;
}
export function hrLight(color = 'cyan') { console.log(colorizer('-----------------------------------------------', color)); }
export function hr(color = 'cyan') { console.log(colorizer('===============================================', color)); }
export function coloredSecretKV(key, value) {
    return `${colorizer(key, 'green')} ${colorizer('=', 'gray', true)} ${colorizer(value, 'magenta')}`;
}
//# sourceMappingURL=logger.js.map