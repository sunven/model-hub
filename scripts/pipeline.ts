import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createSnapshotSource } from './fetch'
import { runSnapshot } from './snapshot'

const args = process.argv.slice(2)
const options = new Set(['--refresh', '--offline', '--data-dir'])
let dataDir = fileURLToPath(new URL('../data/', import.meta.url))
let refresh = false
let offline = false
for (let i = 0; i < args.length; i++) {
  if (!options.has(args[i])) throw new Error(`Unknown argument: ${args[i]}`)
  if (args[i] === '--refresh') refresh = true
  if (args[i] === '--offline') offline = true
  if (args[i] === '--data-dir') {
    const value = args[++i]
    if (!value || value.startsWith('--')) throw new Error('--data-dir requires a path')
    dataDir = path.resolve(value)
  }
}

const result = await runSnapshot({ source: createSnapshotSource({ dataDir, refresh, offline, log: console.log }), dataDir })
console.log(`snapshot ${result.report.snapshotId}`)
if (result.status === 'failed') {
  console.error('\nVALIDATION FAILED')
  for (const failure of result.report.hardFailures.slice(0, 80)) console.error(`- ${failure}`)
  if (result.report.hardFailures.length > 80) console.error(`... ${result.report.hardFailures.length - 80} more`)
  console.error(`\nlatest was not updated. Report: ${path.join(dataDir, 'validation-report.json')}`)
  process.exitCode = 1
} else {
  const { report, manifest } = result
  console.log('\nPASSED')
  console.log(`models=${manifest.counts.models} offers=${manifest.counts.offers} scores=${manifest.counts.scores} unmatched=${manifest.counts.unmatched}`)
  console.log(`scores by board: ${JSON.stringify(report.stats.byBoard)}`)
  console.log(`models with/without scores: ${report.stats.modelsWithScores}/${report.stats.modelsWithoutScores}`)
  console.log(`warnings: ${report.warnings.length} (see ${path.join(dataDir, 'latest/validation-report.json')})`)
  for (const warning of report.warnings.slice(0, 12)) console.log(`  - ${warning}`)
  if (report.warnings.length > 12) console.log(`  ... ${report.warnings.length - 12} more`)
  console.log(`\nwrote ${path.join(dataDir, 'latest')}`)
}
