import fs from 'node:fs/promises'
import path from 'node:path'

/** Stage both directories, then install them together or restore their previous contents. */
export async function publishSnapshot(
  dataDir: string,
  snapshot: Record<string, string>,
  schemas: Record<string, string>,
): Promise<void> {
  await fs.mkdir(dataDir, { recursive: true })
  const staging = await fs.mkdtemp(path.join(dataDir, 'tmp-snapshot-'))
  const backedUp: string[] = []
  const installed: string[] = []
  let retainBackups = false
  try {
    for (const [directory, files] of [['latest', snapshot], ['schema', schemas]] as const) {
      await fs.mkdir(path.join(staging, directory))
      for (const [name, content] of Object.entries(files)) {
        await fs.writeFile(path.join(staging, directory, name), content)
      }
    }
    for (const directory of ['schema', 'latest']) {
      try {
        await fs.rename(path.join(dataDir, directory), path.join(staging, `previous-${directory}`))
        backedUp.push(directory)
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
      }
      await fs.rename(path.join(staging, directory), path.join(dataDir, directory))
      installed.push(directory)
    }
  } catch (error) {
    const rollbackFailures: unknown[] = []
    for (const directory of [...installed].reverse()) {
      try { await fs.rm(path.join(dataDir, directory), { recursive: true, force: true }) }
      catch (failure) { rollbackFailures.push(failure) }
    }
    for (const directory of [...backedUp].reverse()) {
      try { await fs.rename(path.join(staging, `previous-${directory}`), path.join(dataDir, directory)) }
      catch (failure) { rollbackFailures.push(failure) }
    }
    if (rollbackFailures.length) {
      retainBackups = true
      throw new AggregateError([error, ...rollbackFailures], `Publication and rollback failed; backups retained in ${staging}`)
    }
    throw error
  } finally {
    // Cleanup cannot change the committed result; failed cleanup only leaves a staging directory.
    if (!retainBackups) await fs.rm(staging, { recursive: true, force: true }).catch(() => {})
  }
}
