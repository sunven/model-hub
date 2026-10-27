import { test, expect } from '@playwright/test'

test('home renders and search/filter/sort update URL', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.model-row')).toHaveCount(43)

  await page.locator('input.search').fill('Claude')
  await expect(page.locator('.model-row')).toHaveCount(4)
  await expect(page).toHaveURL(/q=Claude/)

  await page.locator('input.search').fill('')
  await page.locator('#lab-filter .check').filter({ hasText: /^\s*OpenAI\s*$/ }).click()
  await expect(page.locator('.model-row')).toHaveCount(4)
  await expect(page).toHaveURL(/labs=OpenAI/)

  await page.selectOption('.sort-select', 'price')
  await expect(page.locator('.model-row').first().locator('.model-name')).toContainText('GPT-6 Luna')
  await expect(page).toHaveURL(/sort=price/)
  await expect(page).toHaveURL(/labs=OpenAI/)
})

test('provider filter includes first-party and gateway-only', async ({ page }) => {
  await page.goto('/')
  await page.locator('#provider-filter summary').click()
  await page.locator('#provider-filter .check').filter({ hasText: /^\s*Anthropic\s*$/ }).click()
  await expect(page.locator('.model-row')).toHaveCount(4)
  await expect(page).toHaveURL(/providers=Anthropic/)

  await page.locator('.filters-head button').filter({ hasText: '清除' }).click()
  await page.locator('#provider-filter').evaluate((el: HTMLDetailsElement) => { el.open = true })
  await page.locator('#provider-filter .check').filter({ hasText: '仅网关' }).click()
  await expect(page.locator('.model-row')).toHaveCount(1)
  await expect(page.locator('.model-row .model-name')).toContainText('Fugu Max')
})

test('compare max 3, tray navigation, and clear all', async ({ page }) => {
  await page.goto('/')
  const checks = page.locator('.model-row input[type=checkbox]')
  await checks.nth(0).check()
  await checks.nth(1).check()
  await checks.nth(2).check()
  await checks.nth(3).click()

  await expect(page.locator('.toast')).toContainText('最多选择 3 个模型')
  await expect(page.locator('.tray-chip')).toHaveCount(3)

  await page.locator('.tray-btn').click()
  await expect(page).toHaveURL(/\/compare\?models=/)
  await expect(page.locator('.compare-table tbody tr')).toHaveCount(11)

  await page.locator('.compare-head button').filter({ hasText: '清空全部' }).click()
  await expect(page.getByText('先选两个模型')).toBeVisible()
})

test('detail offers fold, AA link, and unmarked status', async ({ page }) => {
  await page.goto('/models/anthropic/claude-opus-5-5')
  await expect(page.locator('.offer-table tbody tr')).toHaveCount(6)
  await page.locator('.offer-toggles input').first().check()
  await expect(page.locator('.offer-table tbody tr')).toHaveCount(41)

  await expect(page.locator('.detail-actions a').filter({ hasText: '外部评测' })).toHaveAttribute(
    'href',
    'https://artificialanalysis.ai/models/claude-opus-5-5',
  )
  await expect(page.locator('.detail-badges .badge').first()).toHaveAttribute('title', /可用（上游未标记状态）/)
})

test('missing Arena scores and gateway-only model', async ({ page }) => {
  await page.goto('/models/mistral/codestral-2508')
  await expect(page.getByText('Arena 未收录').first()).toBeVisible()

  await page.goto('/models/sakana/fugu-max')
  await expect(page.getByText('该模型目前只有网关报价').first()).toBeVisible()
  await expect(page.locator('.offer-table tbody tr')).not.toHaveCount(0)
})

test('leaderboard search, show more, and noindex meta', async ({ page }) => {
  await page.goto('/leaderboards/text')
  await expect(page.locator('.lb-table tbody tr')).toHaveCount(50)

  await page.getByRole('button', { name: '显示更多' }).click()
  await expect(page.locator('.lb-table tbody tr')).toHaveCount(100)

  await page.locator('.lb-toolbar input').fill('Kimi')
  await expect(page.locator('.lb-table tbody tr')).toHaveCount(7)
  await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute('content', /noindex/)
})

test('mobile cards and filter drawer', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(page.locator('.mobile-card').first()).toBeVisible()
  await expect(page.locator('.model-row').first()).toBeHidden()

  await page.locator('.toolbar .btn.mobile-only').click()
  await expect(page.locator('#filters-panel')).toHaveClass(/open/)
  await page.locator('.filters-head button').filter({ hasText: '关闭' }).click()
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
  const banner = page.locator('.data-banner')
  await expect(banner).toBeVisible()
  await expect(banner).toContainText('models.dev 快照已超过 48 小时')
  await expect(banner).toContainText('Arena 快照已超过 72 小时')
  await expect(banner).toContainText('汇率已超过 14 天')
})

test('SEO metadata, sitemap, robots, and filtered noindex', async ({ page, request }) => {
  await page.goto('/')
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', /model-hub\.example\/?$/)
  await expect(page.locator('meta[property="og:image"]').first()).toHaveAttribute('content', /og\.png$/)
  await expect(page.locator('script[type="application/ld+json"]').first()).toBeAttached()

  await page.locator('input.search').fill('Claude')
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
