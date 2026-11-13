import { test, expect, type Page } from '@playwright/test'
import manifest from '../data/latest/manifest.json' with { type: 'json' }

const rows = (page: Page) => page.locator('table tbody tr')

async function waitForUrlReady(page: Page) {
  await expect(page.locator('.workbench')).toHaveAttribute('data-url-ready', 'true')
}

test('home renders and search/filter/sort update URL', async ({ page }) => {
  await page.goto('/')
  await expect(rows(page)).toHaveCount(43)
  await waitForUrlReady(page)

  await page.getByRole('searchbox', { name: '搜索模型、实验室或家族' }).fill('Claude')
  await expect(rows(page)).toHaveCount(4)
  await expect(page).toHaveURL(/q=Claude/)

  await page.getByRole('searchbox', { name: '搜索模型、实验室或家族' }).fill('')
  await page.getByRole('checkbox', { name: 'OpenAI', exact: true }).check({ force: true })
  await expect(rows(page)).toHaveCount(4)
  await expect(page).toHaveURL(/labs=OpenAI/)

  await page.getByRole('combobox', { name: '排序' }).click()
  await page.getByRole('option', { name: '输出价格' }).click()
  await expect(rows(page).first()).toContainText('GPT-6 Luna')
  await expect(page).toHaveURL(/sort=price/)
  await expect(page).toHaveURL(/labs=OpenAI/)

  await page.locator('.astryx-token').filter({ hasText: 'OpenAI' }).getByRole('button').click()
  await expect(rows(page)).toHaveCount(43)
  await expect(page).not.toHaveURL(/labs=OpenAI/)
  await expect(page).toHaveURL(/sort=price/)
})

test('provider filter includes first-party and gateway-only', async ({ page }) => {
  await page.goto('/')
  await waitForUrlReady(page)
  await page.getByRole('button', { name: '托管商（更多）' }).click()
  await page.getByRole('button', { name: '托管商', exact: true }).click()
  await page.locator('.astryx-multi-selector-popup').getByText('Anthropic', { exact: true }).click()
  await page.keyboard.press('Escape')
  await expect(rows(page)).toHaveCount(4)
  await expect(page).toHaveURL(/providers=Anthropic/)

  await page.getByRole('button', { name: '清除', exact: true }).click()
  await page.getByRole('switch', { name: '仅网关（无第一方 / 云报价）' }).check({ force: true })
  await expect(rows(page)).toHaveCount(1)
  await expect(rows(page).first()).toContainText('Fugu Max')
})

test('compare max 3, tray navigation, and clear all', async ({ page }) => {
  await page.goto('/')
  await waitForUrlReady(page)
  const checks = page.getByRole('checkbox', { name: /加入对比/ })
  const count = await checks.count()
  for (let i = 0; i < 3; i++) await checks.nth(i).check({ force: true })
  await checks.nth(3).click({ force: true })

  await expect(page.getByText('最多选择 3 个模型').first()).toBeVisible()
  const tray = page.getByRole('region', { name: '对比托盘' })
  await expect(tray.locator('.astryx-token')).toHaveCount(3)
  expect(count).toBe(43)

  await tray.getByRole('link', { name: '去对比' }).click()
  await expect(page).toHaveURL(/\/compare\?models=/)
  await expect(rows(page)).toHaveCount(11)

  await page.getByRole('button', { name: '清空全部' }).click()
  await expect(page.getByRole('heading', { name: '先选两个模型' })).toBeVisible()
})

test('detail offers fold, AA link, and unmarked status', async ({ page }) => {
  await page.goto('/models/anthropic/claude-opus-5-5')
  await expect(rows(page)).toHaveCount(6)
  await page.getByRole('switch', { name: '显示网关报价' }).check({ force: true })
  await expect(rows(page)).toHaveCount(41)

  await expect(page.getByRole('link', { name: '外部评测 · AA' })).toHaveAttribute(
    'href',
    'https://artificialanalysis.ai/models/claude-opus-5-5',
  )
  const badge = page.getByText('可用', { exact: true }).first()
  await badge.hover()
  await expect(page.getByText('可用（上游未标记状态）')).toBeVisible()
})

test('missing Arena scores and gateway-only model', async ({ page }) => {
  await page.goto('/models/mistral/codestral-2508')
  await expect(page.getByText('Arena 未收录').first()).toBeVisible()

  await page.goto('/models/sakana/fugu-max')
  await expect(page.getByText('该模型目前只有网关报价').first()).toBeVisible()
  await expect(rows(page)).not.toHaveCount(0)
})

test('leaderboard search, show more, and noindex meta', async ({ page }) => {
  await page.goto('/leaderboards/text')
  await expect(rows(page)).toHaveCount(50)

  await page.getByRole('button', { name: '显示更多' }).click()
  await expect(rows(page)).toHaveCount(100)

  await page.getByRole('searchbox', { name: '搜索模型、组织或条件' }).fill('Kimi')
  await expect(rows(page)).toHaveCount(8)
  await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute('content', /noindex/)
})

test('mobile cards and filter drawer', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await waitForUrlReady(page)
  await expect(page.locator('.mobile-list .astryx-card').first()).toBeVisible()
  await expect(rows(page).first()).toBeHidden()

  await page.getByRole('button', { name: '筛选' }).click()
  await expect(page.locator('#filters-panel')).toHaveClass(/open/)
  await page.getByRole('button', { name: '关闭' }).click()
  await expect(page.locator('#filters-panel')).not.toHaveClass(/open/)
})

test('about and 404 pages', async ({ page }) => {
  await page.goto('/about')
  await expect(page.getByText('CC BY 4.0').first()).toBeVisible()
  await expect(page.getByText('当前覆盖')).toBeVisible()
  await expect(page.getByRole('link', { name: 'GitHub Issues' }).first()).toHaveAttribute(
    'href',
    'https://github.com/sunven/model-hub/issues/new/choose',
  )

  await page.goto('/no-such-page')
  await expect(page.getByText('没有找到这个页面')).toBeVisible()
})

test('stale snapshot banner appears after thresholds', async ({ page }) => {
  await page.clock.install({ time: new Date('2027-01-05T00:00:00Z') })
  await page.goto('/')
  const banner = page.getByTestId('freshness-banner')
  await expect(banner).toBeVisible()
  await expect(banner).toContainText('models.dev 快照已超过 48 小时')
  await expect(banner).toContainText('Arena 快照已超过 72 小时')
  await expect(banner).toContainText('汇率已超过 14 天')
})

for (const { route, cny, usd } of [
  {
    route: '/models/anthropic/claude-opus-5-5',
    cny: '.cny-range',
    usd: '.astryx-card:has-text("价格 · 输入 / 输出")',
  },
  { route: '/compare?models=mv_anthropic__claude-opus-5-5', cny: '.compare-table .cell-block', usd: '.compare-table' },
]) {
  test(`FX expiry updates CNY and the banner together on ${route}`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    const expiry = new Date(Date.parse(manifest.fx.as_of) + 14 * 86_400_000)
    await page.clock.install({ time: expiry })
    await page.clock.pauseAt(expiry)
    await page.goto(route)
    await expect(page.locator(cny)).toHaveCount(2)
    await expect(page.locator(cny).first()).toContainText('≈¥')
    await expect(page.getByTestId('freshness-banner')).not.toContainText('汇率已超过')
    await page.clock.runFor(1)
    await expect(page.locator(cny)).toHaveCount(0)
    await expect(page.getByTestId('freshness-banner')).toContainText('汇率已超过 14 天')
    await expect(page.locator(usd)).toContainText('$')

    // Opening a previously generated page after expiry must not restore CNY.
    await page.reload()
    await expect(page.getByTestId('freshness-banner')).toContainText('汇率已超过 14 天')
    await expect(page.locator(cny)).toHaveCount(0)
    expect(errors).toEqual([])
  })
}

for (const { timestamp, hours, message } of [
  { timestamp: manifest.freshness.modelsDev.fetchedAt, hours: 48, message: 'models.dev 快照已超过 48 小时' },
  { timestamp: manifest.freshness.arena.fetchedAt, hours: 72, message: 'Arena 快照已超过 72 小时' },
]) {
  test(`data stays visible when ${message}`, async ({ page }) => {
    const expiry = new Date(Date.parse(timestamp) + hours * 3_600_000)
    await page.clock.install({ time: expiry })
    await page.clock.pauseAt(expiry)
    await page.goto('/')
    await waitForUrlReady(page)
    await expect(rows(page)).toHaveCount(43)
    await expect(page.getByTestId('freshness-banner').filter({ hasText: message })).toHaveCount(0)
    await page.clock.runFor(1)
    await expect(page.getByTestId('freshness-banner')).toContainText(message)
    await expect(rows(page)).toHaveCount(43)
  })
}

test('SEO metadata, sitemap, robots, and filtered noindex', async ({ page, request }) => {
  await page.goto('/')
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', /model-hub\.example\/?$/)
  await expect(page.locator('meta[property="og:image"]').first()).toHaveAttribute('content', /og\.png$/)
  await expect(page.locator('script[type="application/ld+json"]').first()).toBeAttached()
  await waitForUrlReady(page)

  await page.getByRole('searchbox', { name: '搜索模型、实验室或家族' }).fill('Claude')
  await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute('content', /noindex/)

  await page.goto('/compare')
  await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute('content', /noindex/)

  const sitemap = await request.get('/sitemap.xml')
  expect(sitemap.status()).toBe(200)
  const sitemapText = await sitemap.text()
  expect(sitemapText).toContain('/models/anthropic/claude-opus-5-5')
  expect(sitemapText).toContain('/leaderboards/webdev')
  expect(sitemapText).not.toContain('/compare')

  const robots = await request.get('/robots.txt')
  expect(robots.status()).toBe(200)
  const robotsText = await robots.text()
  expect(robotsText).toContain('Sitemap: https://model-hub.example/sitemap.xml')
  expect(robotsText).toContain('Disallow: /compare')
})
