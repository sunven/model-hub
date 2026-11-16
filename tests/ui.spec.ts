import { test, expect, type Page } from '@playwright/test'
import manifest from '../data/latest/manifest.json' with { type: 'json' }
import offers from '../data/latest/offers.json' with { type: 'json' }

const rows = (page: Page) => page.locator('main table tbody tr')

async function waitForUrlReady(page: Page) {
  await expect(page.locator('.workbench')).toHaveAttribute('data-url-ready', 'true')
}

for (const { key, label, direction } of [
  { key: 'context', label: '上下文', direction: 'desc' },
  { key: 'price', label: '价格', direction: 'asc' },
  { key: 'arena_text', label: 'Arena text', direction: 'desc' },
  { key: 'arena_webdev', label: 'Arena webdev', direction: 'desc' },
]) {
  test(`repeated ${key} header clicks alternate and restore the model order`, async ({ page }) => {
    await page.goto('/?sort=newest')
    await waitForUrlReady(page)
    const header = page.getByRole('button', { name: label, exact: true })
    const modelNames = () => rows(page).getByRole('link').allTextContents()

    await header.click()
    await expect(page).toHaveURL(url => url.searchParams.get('sort') === (key === 'arena_text' ? null : key))
    const defaultOrder = await modelNames()

    await header.click()
    await expect.poll(modelNames).not.toEqual(defaultOrder)
    await expect(page).toHaveURL(url => url.searchParams.get('order') === (direction === 'asc' ? 'desc' : 'asc'))
    await expect(header).toHaveAttribute('aria-description', new RegExp(`^当前${direction === 'asc' ? '降序' : '升序'}`))
    const reversedOrder = await modelNames()

    await page.reload()
    await waitForUrlReady(page)
    await expect.poll(modelNames).toEqual(reversedOrder)

    await header.click()
    await expect.poll(modelNames).toEqual(defaultOrder)
    await expect(page).toHaveURL(url => !url.searchParams.has('order'))
  })
}

test('changing the sort field restores its default direction and preserves filters', async ({ page }) => {
  await page.goto('/?labs=Anthropic&sort=context&order=asc')
  await waitForUrlReady(page)
  await expect(rows(page)).toHaveCount(4)

  await page.getByRole('button', { name: '价格', exact: true }).click()
  await expect(page).toHaveURL(url => url.searchParams.get('sort') === 'price' && !url.searchParams.has('order'))
  await expect(rows(page).first()).toContainText('Claude Haiku 5.5')

  await page.getByRole('button', { name: '价格', exact: true }).click()
  await expect(page).toHaveURL(/order=desc/)
  await expect(rows(page).first()).toContainText('Claude Fable 5.1')
  await expect(rows(page)).toHaveCount(4)
  await expect(page.getByRole('checkbox', { name: 'Anthropic', exact: true })).toBeChecked()

  await page.getByRole('button', { name: '上下文', exact: true }).click()
  await expect(page).toHaveURL(url => url.searchParams.get('sort') === 'context' && !url.searchParams.has('order'))
  await expect(page.getByRole('button', { name: '上下文', exact: true })).toHaveAttribute('aria-description', /^当前降序/)
})

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

  await page.getByRole('button', { name: '价格', exact: true }).click()
  await expect(rows(page).first()).toContainText('GPT-6 Luna')
  await expect(page).toHaveURL(/sort=price/)
  await expect(page).toHaveURL(/labs=OpenAI/)

  await page.locator('.astryx-token').filter({ hasText: 'OpenAI' }).getByRole('button').click()
  await expect(rows(page)).toHaveCount(43)
  await expect(page).not.toHaveURL(/labs=OpenAI/)
  await expect(page).toHaveURL(/sort=price/)
})

test('shared filters restore on load and can be cleared', async ({ page }) => {
  await page.goto('/?labs=Anthropic&sort=price')
  await waitForUrlReady(page)
  await expect(rows(page)).toHaveCount(4)
  await expect(page.getByRole('checkbox', { name: 'Anthropic', exact: true })).toBeChecked()
  await expect(page).toHaveURL(/labs=Anthropic/)
  await expect(page).toHaveURL(/sort=price/)

  await page.getByRole('button', { name: '清除', exact: true }).click()
  await expect(rows(page)).toHaveCount(43)
  await expect(page).toHaveURL('/')
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
  await expect(rows(page)).toHaveCount(offers.filter(offer => offer.modelVersionId === 'mv_anthropic__claude-opus-5-5').length)

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

test('mobile model rows and filter panel', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await waitForUrlReady(page)
  await expect(page.locator('.mobile-list article').first()).toBeVisible()
  await expect(rows(page).first()).toBeHidden()

  await page.getByRole('button', { name: '筛选' }).click()
  await expect(page.locator('#filters-panel')).toHaveClass(/open/)
  await page.getByRole('button', { name: '关闭' }).click()
  await expect(page.locator('#filters-panel')).not.toHaveClass(/open/)
})

test('component styling survives the global reset', async ({ page }) => {
  await page.goto('/')
  const heading = page.getByRole('heading', { name: '全部模型', level: 1 })
  await expect(heading).toBeVisible()
  const typography = await heading.evaluate(element => ({
    heading: parseFloat(getComputedStyle(element).fontSize),
    body: parseFloat(getComputedStyle(document.body).fontSize),
  }))
  expect(typography.heading).toBeGreaterThan(typography.body * 1.25)
  const padding = await rows(page).first().locator('td').first().evaluate(element =>
    parseFloat(getComputedStyle(element).paddingTop),
  )
  expect(padding).toBeGreaterThanOrEqual(8)
  await page.setViewportSize({ width: 390, height: 844 })
  const filterButton = page.getByRole('button', { name: '筛选', exact: true })
  await expect(filterButton).toBeVisible()
  await expect(filterButton).toHaveCSS('border-top-width', '1px')
})

test('mobile sorting preserves filters and supports reversing the order', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/?labs=Anthropic')
  await waitForUrlReady(page)
  const models = page.locator('.mobile-list article')
  await page.getByRole('combobox', { name: '排序方式', exact: true }).click()
  await page.getByRole('option', { name: '输出价格', exact: true }).click()
  await expect(models.first()).toContainText('Claude Haiku 5.5')
  await expect(page).toHaveURL(/labs=Anthropic/)
  await expect(page).toHaveURL(/sort=price/)
  await page.getByRole('button', { name: '升序', exact: true }).click()
  await expect(models.first()).toContainText('Claude Fable 5.1')
  await expect(page).toHaveURL(/order=desc/)
})

test('selected labs stay visible when the lab list is collapsed', async ({ page }) => {
  await page.goto('/?labs=Sakana')
  await waitForUrlReady(page)
  await expect(page.getByRole('checkbox', { name: 'Sakana', exact: true })).toBeChecked()
  await page.getByRole('button', { name: '查看全部 20 家实验室' }).click()
  await expect(page.getByRole('checkbox', { name: 'Inception', exact: true })).toBeVisible()
  await page.getByRole('button', { name: '收起实验室' }).click()
  await expect(page.getByRole('checkbox', { name: 'Sakana', exact: true })).toBeChecked()
})

test('workbench stays within the viewport on desktop, tablet, and phone', async ({ page }) => {
  for (const width of [1440, 1024, 820, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    await waitForUrlReady(page)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow, `page overflow at ${width}`).toBeLessThanOrEqual(1)
    if (width >= 980) {
      const tableOverflow = await page.locator('.model-table .astryx-table-scroll-wrapper').evaluate(element =>
        element.scrollWidth - element.clientWidth,
      )
      expect(tableOverflow, `table overflow at ${width}`).toBeLessThanOrEqual(1)
    } else {
      await expect(page.getByRole('combobox', { name: '排序方式', exact: true })).toBeVisible()
    }
  }
})

test('filters and comparison survive switching between mobile and desktop', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/?labs=Anthropic&sort=price')
  await waitForUrlReady(page)

  const cards = page.locator('.mobile-list article')
  await expect(cards).toHaveCount(4)
  const opus = cards.filter({ has: page.getByRole('link', { name: 'Claude Opus 5.5', exact: true }) })
  await opus.getByRole('button', { name: '对比', exact: true }).click()

  await page.getByRole('button', { name: '筛选', exact: true }).click()
  await expect(page.getByRole('checkbox', { name: 'Anthropic', exact: true })).toBeChecked()
  await page.getByRole('checkbox', { name: 'OpenAI', exact: true }).check({ force: true })
  await page.getByRole('button', { name: '关闭', exact: true }).click()
  await expect(cards).toHaveCount(8)

  await page.setViewportSize({ width: 1440, height: 1000 })
  await expect(rows(page)).toHaveCount(8)
  await expect(page.getByRole('checkbox', { name: '加入对比 Claude Opus 5.5', exact: true })).toBeChecked()
  await page.getByRole('checkbox', { name: '加入对比 GPT-6 Luna', exact: true }).check({ force: true })

  await page.setViewportSize({ width: 390, height: 844 })
  await expect(opus.getByRole('button', { name: '已加入', exact: true })).toBeVisible()
  await expect(page.getByRole('region', { name: '对比托盘' }).locator('.astryx-token')).toHaveCount(2)
  await page.getByRole('button', { name: '筛选', exact: true }).click()
  await expect(page.getByRole('checkbox', { name: 'OpenAI', exact: true })).toBeChecked()
  expect(errors).toEqual([])
})

test('mobile models below the initial viewport remain interactive', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await waitForUrlReady(page)
  const last = page.locator('.mobile-list article').last()
  await last.scrollIntoViewIfNeeded()
  const name = await last.getByRole('heading').innerText()
  await last.getByRole('button', { name: '对比', exact: true }).click()
  await expect(page.getByRole('region', { name: '对比托盘' })).toContainText(name)
})

test.describe('touch comparison', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } })

  test('targets still work after scrolling to previously skipped models', async ({ page }) => {
    await page.goto('/')
    await waitForUrlReady(page)
    const cards = page.locator('.mobile-list article')
    await cards.first().getByRole('button', { name: '对比', exact: true }).tap()
    const last = cards.last()
    await last.scrollIntoViewIfNeeded()
    const name = await last.getByRole('heading').innerText()
    await last.getByRole('button', { name: '对比', exact: true }).tap()
    const tray = page.getByRole('region', { name: '对比托盘' })
    await expect(tray.locator('.astryx-token')).toHaveCount(2)
    await expect(tray).toContainText(name)
    await last.getByRole('button', { name: '已加入', exact: true }).tap()
    await expect(tray.locator('.astryx-token')).toHaveCount(1)
  })
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
