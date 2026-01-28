import { spawn } from 'node:child_process'

/* ----------------------------------
 * Spinner (riutilizzabile)
 * ---------------------------------- */

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

function createSpinner(label = 'loading ') {
  const enabled = process.stdout.isTTY && !process.env.CI
  let i = 0
  let timer: NodeJS.Timeout | undefined

  const start = () => {
    if (!enabled) return
    process.stdout.write(`${SPINNER_FRAMES[i]} ${label}`)
    timer = setInterval(() => {
      i = (i + 1) % SPINNER_FRAMES.length
      process.stdout.write(`\r${SPINNER_FRAMES[i]} ${label}`)
    }, 80)
  }

  const stop = () => {
    if (!enabled) return
    if (timer) clearInterval(timer)
    process.stdout.write('\r\x1b[2K') // clear line
  }

  return { start, stop }
}

/* ----------------------------------
 * run (stdout diretto)
 * ---------------------------------- */

export function run(command: string, label?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const spinner = createSpinner(label)
    spinner.start()

    const child = spawn(command, { shell: true, stdio: 'inherit' })

    child.on('error', (e) => {
      spinner.stop()
      reject(e)
    })

    child.on('exit', (code) => {
      spinner.stop()
      code === 0
        ? resolve()
        : reject(new Error(`Command failed (${code}): ${command}`))
    })
  })
}

/* ----------------------------------
 * runWithStdin
 * ---------------------------------- */

export function runWithStdin(
  command: string,
  stdinText: string,
  label?: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const spinner = createSpinner(label)
    spinner.start()

    const child = spawn(command, {
      shell: true,
      stdio: ['pipe', 'inherit', 'inherit']
    })

    child.on('error', (e) => {
      spinner.stop()
      reject(e)
    })

    child.on('exit', (code) => {
      spinner.stop()
      code === 0
        ? resolve()
        : reject(new Error(`Command failed (${code}): ${command}`))
    })

    child.stdin?.write(stdinText)
    child.stdin?.end()
  })
}

/* ----------------------------------
 * runCapture (stdout catturato)
 * ---------------------------------- */

export function runCapture(command: string, label?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const spinner = createSpinner(label)
    spinner.start()

    const child = spawn(command, {
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe']
    })

    let out = ''
    let err = ''

    child.stdout.on('data', (d) => (out += d.toString()))
    child.stderr.on('data', (d) => (err += d.toString()))

    child.on('error', (e) => {
      spinner.stop()
      reject(e)
    })

    child.on('exit', (code) => {
      spinner.stop()
      code === 0
        ? resolve(out.trim())
        : reject(new Error(err || `Command failed (${code}): ${command}`))
    })
  })
}
