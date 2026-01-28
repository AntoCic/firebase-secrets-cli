import select from '@inquirer/select';
import inquirer from 'inquirer';
export async function pickSecretKey(opts) {
    const otherLabel = opts.otherLabel ?? 'Other…';
    const choices = [
        ...opts.keys
            .slice()
            .sort((a, b) => a.localeCompare(b))
            .map((k) => ({ name: k, value: k })),
        { name: otherLabel, value: '__OTHER__' }
    ];
    const picked = await select({
        message: opts.message,
        choices
    });
    if (picked !== '__OTHER__')
        return picked;
    const { name } = await inquirer.prompt([
        {
            type: 'input',
            name: 'name',
            message: 'Nome secret',
            validate: (v) => !!v.trim() || 'Obbligatorio'
        }
    ]);
    return name.trim();
}
//# sourceMappingURL=secretKeyPicker.js.map