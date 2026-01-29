# firebase-secrets-cli

CLI interattiva per la gestione centralizzata dei **Firebase Functions Secrets** (Firebase Secrets Manager), con sincronizzazione dei riferimenti anche nei file locali del repository.

## Obiettivo

Semplificare e standardizzare le operazioni sui secrets usati dalle Cloud Functions, evitando errori manuali e mantenendo allineati:

- **Firebase Secrets Manager (ONLINE)**: valore reale del secret
- **functions/.secret.local (LOCALE)**: elenco chiavi (e talvolta valori) utile per sviluppo/ops
- **functions/src/config/secret.ts (CODICE)**: “registry” tipizzato delle chiavi disponibili nel progetto

## Cosa fa la CLI

All’avvio, mostra un menu “Firebase Secrets Manager” con queste azioni:

- **get**: legge e mostra il valore di una secret (accesso online)
- **list**: mostra tutte le secrets presenti in `secret.ts` e ne stampa i valori (**con conferma**, perché espone valori a schermo)
- **set**: crea una nuova secret online e aggiorna anche `.secret.local` + `secret.ts`
- **update**: aggiorna il valore online e garantisce che la key sia presente in `.secret.local` e `secret.ts`
- **destroy**: elimina la secret online (con conferma) e poi:
  - commenta la riga corrispondente in `.secret.local`
  - rimuove la key da `secret.ts`
- **syncToLocal**: prende il valore online e lo scrive in `.secret.local` come `KEY=VALUE`
- **reviveFromLocal**: ripristina online una secret partendo da una riga commentata ma con valore in `.secret.local` (es. `# KEY=VALORE`), poi:
  - scrive online
  - aggiunge la key a `secret.ts`
  - decommenta e normalizza la riga in `.secret.local`

### Come vengono scelte le secret

La CLI propone una lista di chiavi lette da `functions/src/config/secret.ts`, ma permette anche di inserire una chiave manualmente con l’opzione **“Other…”**.

## Sicurezza

- L’azione **list** stampa i valori dei secrets: viene richiesta **conferma esplicita**.
- Le operazioni usano i comandi `firebase functions:secrets:*`, quindi serve:
  - essere autenticati su Firebase
  - avere i permessi corretti sul progetto

## Requisiti

- **Node.js** (progetto TypeScript ESM)
- **Firebase CLI** installata e autenticata (`firebase login`)
- Repository che contenga (o che tu voglia allineare a) la struttura:
  - `functions/.secret.local`
  - `functions/src/config/secret.ts`

> Nota: i path sono risolti con `process.cwd()`. In pratica la CLI si aspetta di essere lanciata dalla root del repo che contiene la cartella `functions/`.

## Installazione

### npm

```bash
npm i -D firebase-secrets-cli
```

## Comandi disponibili

Il pacchetto espone questi binari (da `package.json`):

- `firebase-secrets` → CLI principale
- `cic-index` → entrypoint secondario (utility/launcher)
- `cic-bump` → utility di bump versione
- `cic-push` → utility per aggiornare `CHANGELOG.md` e gestire commit/tag/push Git

Esempi:

```bash
# CLI principale
npx firebase-secrets

# utility index (se prevista nel tuo flusso)
npx cic-index

# bump versione (se prevista nel tuo flusso)
npx cic-bump

# push changelog + git (se prevista nel tuo flusso)
npx cic-push
```

## Troubleshooting

### “Non trova functions/.secret.local o secret.ts”

- Verifica di lanciare il comando dalla **root del repo** (dove esiste `functions/`).
- In caso di repo senza i file, la CLI dovrebbe poterli creare/aggiornare quando esegui operazioni tipo `set`/`update` (dipende dall’implementazione). Se non ci sono controlli ancora, aggiungerli è una buona prossima patch:
  - se manca `functions/` → errore chiaro
  - se manca `.secret.local` → creazione file vuoto
  - se manca `secret.ts` → scaffolding minimale del registry

### Permessi Firebase

Se i comandi `firebase functions:secrets:*` falliscono:

- `firebase login`
- seleziona il progetto corretto (`firebase use <alias|projectId>`)
- verifica di avere i permessi IAM necessari

---

## Informazioni dal pacchetto

- Nome: `firebase-secrets-cli`
- Versione: `0.1.0`
- Bin: `firebase-secrets`, `cic:index`, `cic:bump`
