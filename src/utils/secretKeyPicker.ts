import select from '@inquirer/select'
import inquirer from 'inquirer'

export async function pickSecretKey(opts: {
  message: string
  keys: string[]
  otherLabel?: string
}): Promise<string> {
  const otherLabel = opts.otherLabel ?? 'Other…'

  const choices = [
    ...opts.keys
      .slice()
      .sort((a, b) => a.localeCompare(b))
      .map((k) => ({ name: k, value: k })),
    { name: otherLabel, value: '__OTHER__' as const }
  ]

  const picked = await select<string>({
    message: opts.message,
    choices
  })

  if (picked !== '__OTHER__') return picked

  const { name } = await inquirer.prompt<{ name: string }>([
    {
      type: 'input',
      name: 'name',
      message: 'Nome secret',
      validate: (v) => !!v.trim() || 'Obbligatorio'
    }
  ])

  return name.trim()
}
