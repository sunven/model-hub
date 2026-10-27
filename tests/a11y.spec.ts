import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const routes = [
  '/',
  '/models/anthropic/claude-opus-5-5',
  '/leaderboards/text',
  '/about',
  '/compare?models=mv_anthropic__claude-opus-5-5,mv_openai__gpt-6-luna',
]

for (const route of routes) {
  test(`axe smoke: ${route}`, async ({ page }) => {
    await page.goto(route)
    await page.locator('main').waitFor()
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    expect(results.violations).toEqual([])
  })
}
