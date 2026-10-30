import path from 'node:path'
import { parseArgs } from 'node:util'
import { fileURLToPath } from 'node:url'
import { createSnapshotSource } from './fetch'
import { runSnapshot } from './snapshot'

const { values } = parseArgs({
  options: {
    refresh: { type: 'boolean', default: false },
    offline: { type: 'boolean', default: false },
    'data-dir': { type: 'string' },
  },
})
const dataDir = values['data-dir']
  ? path.resolve(values['data-dir'])
  : fileURLToPath(new URL('../data/', import.meta.url))

const result = await runSnapshot({
  source: createSnapshotSource({ dataDir, refresh: values.refresh, offline: values.offline, log: console.log }),
  dataDir,
})
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
