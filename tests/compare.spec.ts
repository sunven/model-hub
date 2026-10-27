import { test, expect, type Page } from '@playwright/test'

const models = [
  { id: 'mv_anthropic__claude-opus-5-5', name: 'Claude Opus 5.5' },
  { id: 'mv_openai__gpt-6-luna', name: 'GPT-6 Luna' },
  { id: 'mv_anthropic__claude-sonnet-5-5', name: 'Claude Sonnet 5.5' },
  { id: 'mv_anthropic__claude-haiku-5-5', name: 'Claude Haiku 5.5' },
]
const selectionUrl = (ids: string[]) => `/compare?models=${ids.join(',')}`

async function seedOnce(page: Page, value: unknown) {
  await page.addInitScript(value => {
    if (sessionStorage.getItem('compare-test-seeded')) return
    localStorage.setItem('modelhub.compare', JSON.stringify(value))
    sessionStorage.setItem('compare-test-seeded', 'yes')
  }, value)
}

async function expectSelection(page: Page, indices: number[]) {
  if (indices.length) {
    await expect(page.locator('.compare-table thead th a')).toHaveText(indices.map(index => models[index].name))
    await expect(page.locator('.compare-count b')).toHaveText(String(indices.length))
  } else {
    await expect(page.getByRole('heading', { name: '先选两个模型' })).toBeVisible()
    await expect(page.locator('.compare-count')).toHaveCount(0)
  }
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('modelhub.compare')!)))
    .toEqual(indices.map(index => models[index].id))
}

test('shared URL wins over stored choices and normalizes invalid, duplicate, and excess IDs', async ({ page }) => {
  await seedOnce(page, [models[3].id])
  await page.goto(selectionUrl(['missing', models[1].id, models[1].id, models[0].id, models[2].id, models[3].id]))
  await expectSelection(page, [1, 0, 2])
  await expect.poll(() => new URL(page.url()).searchParams.get('models'))
    .toBe([models[1].id, models[0].id, models[2].id].join(','))
  await page.reload()
  await expectSelection(page, [1, 0, 2])
})

for (const value of ['', 'missing']) {
  test(`explicit ${value ? 'invalid' : 'empty'} URL choices override stored choices`, async ({ page }) => {
    await seedOnce(page, [models[0].id, models[1].id])
    await page.goto(selectionUrl([value]))
    await expectSelection(page, [])
    await expect.poll(() => new URL(page.url()).searchParams.has('models')).toBe(false)
    await page.reload()
    await expectSelection(page, [])
  })
}

test('malformed browser storage is sanitized without crashing the page', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/compare')
  await expectSelection(page, [])
  for (const stored of ['{broken', '{}', 'null', '"text"', '[1,null,"missing"]']) {
    await page.evaluate(stored => localStorage.setItem('modelhub.compare', stored), stored)
    await page.reload()
    await expectSelection(page, [])
  }
  expect(errors).toEqual([])
})

test('bare compare restores storage and remove/clear preserve unrelated URL and history state', async ({ page }) => {
  await seedOnce(page, [models[0].id, models[1].id, models[2].id])
  await page.goto('/compare?ref=shared#fields')
  await expectSelection(page, [0, 1, 2])
  await page.evaluate(() => history.replaceState({ ...history.state, marker: 'keep' }, '', location.href))
  await page.locator('.compare-table thead th').filter({ hasText: models[1].name }).getByRole('button', { name: '移除' }).click()
  await expectSelection(page, [0, 2])
  expect(new URL(page.url()).searchParams.get('ref')).toBe('shared')
  expect(new URL(page.url()).hash).toBe('#fields')
  expect(await page.evaluate(() => history.state.marker)).toBe('keep')
  await page.reload()
  await expectSelection(page, [0, 2])
  await page.getByRole('button', { name: '清空全部' }).click()
  await expectSelection(page, [])
  expect(new URL(page.url()).searchParams.get('ref')).toBe('shared')
  expect(new URL(page.url()).hash).toBe('#fields')
  await page.reload()
  await expectSelection(page, [])
})

test('same-route URL navigation, back, and forward update the one Compare Set', async ({ page }) => {
  await page.goto(selectionUrl([models[0].id, models[1].id]))
  await expectSelection(page, [0, 1])
  await page.evaluate(url => history.pushState(null, '', url), selectionUrl([models[1].id, models[2].id]))
  await expectSelection(page, [1, 2])
  await page.evaluate(() => history.pushState(null, '', '/compare?models='))
  await expectSelection(page, [])
  await page.goBack()
  await expectSelection(page, [1, 2])
  await page.goBack()
  await expectSelection(page, [0, 1])
  await page.goForward()
  await expectSelection(page, [1, 2])
})

test('home, detail, tray, header, and compare page share the selection across client navigation', async ({ page }) => {
  await page.goto(selectionUrl([models[0].id, models[1].id]))
  await expectSelection(page, [0, 1])
  await page.getByRole('banner').getByRole('link', { name: 'Model Hub 首页' }).click()
  await expect(page.locator('.tray-chip')).toHaveCount(2)
  await page.locator('.model-row').filter({ hasText: models[0].name }).locator('.model-name').click()
  await expect(page.getByRole('button', { name: '已加入对比' })).toBeVisible()
  await page.getByRole('button', { name: '已加入对比' }).click()
  await expect(page.locator('.tray-chip')).toHaveCount(1)
  await expect(page.locator('.compare-count')).toHaveAttribute('href', selectionUrl([models[1].id]))
  await page.locator('.compare-count').click()
  await expectSelection(page, [1])
})

test('back to a formerly empty compare URL clears later selections', async ({ page }) => {
  await page.goto('/compare')
  await expectSelection(page, [])
  await page.getByRole('link', { name: '去模型表' }).click()
  for (const model of models.slice(0, 2)) {
    await page.locator('.model-row').filter({ hasText: model.name }).locator('input[type=checkbox]').check()
  }
  await page.locator('.tray-btn').click()
  await expectSelection(page, [0, 1])
  await page.goBack()
  await expect(page.locator('.tray-chip')).toHaveCount(2)
  await page.goBack()
  await expectSelection(page, [])
  await page.goForward()
  await expect(page.locator('.model-row')).toHaveCount(43)
  await expect(page.locator('.compare-tray')).toHaveCount(0)
})

test('comparison still works when browser storage is blocked', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('blocked', 'SecurityError') } })
  })
  await page.goto(selectionUrl([models[0].id, models[1].id]))
  await expect(page.locator('.compare-table thead th a')).toHaveText([models[0].name, models[1].name])
  await page.locator('.compare-table thead th').filter({ hasText: models[0].name }).getByRole('button', { name: '移除' }).click()
  await expect(page.locator('.compare-table thead th a')).toHaveText([models[1].name])
  await expect.poll(() => new URL(page.url()).searchParams.get('models')).toBe(models[1].id)
  await page.reload()
  await expect(page.locator('.compare-table thead th a')).toHaveText([models[1].name])
  expect(errors).toEqual([])
})
