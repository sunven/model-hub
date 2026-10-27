import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { generateJsonSchemas } from '../lib/snapshot'

const mode = process.argv[2]
if (process.argv.length !== 3 || (mode !== '--check' && mode !== '--write')) {
  throw new Error('Usage: tsx scripts/schemas.ts --check | --write')
}

const schemaDir = new URL('../data/schema/', import.meta.url)
const schemas = generateJsonSchemas()
if (mode === '--write') {
  await mkdir(schemaDir, { recursive: true })
  for (const [file, schema] of Object.entries(schemas)) {
    await writeFile(new URL(file, schemaDir), JSON.stringify(schema, null, 2) + '\n')
  }
  console.log(`Generated ${Object.keys(schemas).length} JSON Schemas in ${fileURLToPath(schemaDir)}`)
} else {
  const drift: string[] = []
  for (const [file, schema] of Object.entries(schemas)) {
    const current = await readFile(new URL(file, schemaDir), 'utf8').catch(error => {
      if (error.code === 'ENOENT') return null
      throw error
    })
    if (current !== JSON.stringify(schema, null, 2) + '\n') drift.push(file)
  }
  const files = await readdir(schemaDir).catch(error => {
    if (error.code === 'ENOENT') return []
    throw error
  })
  drift.push(...files.filter(file => file.endsWith('.schema.json') && !(file in schemas)))
  if (drift.length) {
    console.error(`JSON Schema drift: ${drift.join(', ')}. Run npm run schema:generate and remove obsolete schemas.`)
    process.exitCode = 1
  } else {
    console.log(`All ${Object.keys(schemas).length} JSON Schemas match lib/snapshot.ts`)
  }
}
