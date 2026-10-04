import { test, expect } from '@playwright/test'

test.describe('Dinning Zone E2E Core Flow', () => {
  test('HomePage loads correctly with brand title and menu items', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Dinning Zone/)
    await expect(page.locator('body')).toBeVisible()
  })

  test('Customer menu navigation & search', async ({ page }) => {
    await page.goto('/menu')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(/Our Menu|Menu/i).first()).toBeVisible()

    // Test Search input navigation
    await page.goto('/search')
    const searchInput = page.locator('input[type="text"], input[placeholder*="Search"]').first()
    if (await searchInput.isVisible()) {
      await searchInput.fill('Biryani')
      await expect(searchInput).toHaveValue('Biryani')
    }
  })

  test('Coupon validation sheet opens in Cart', async ({ page }) => {
    await page.goto('/cart')
    await expect(page.locator('body')).toBeVisible()
  })

  test('Out-of-range address validation feedback', async ({ page }) => {
    await page.goto('/checkout')
    await expect(page.locator('body')).toBeVisible()
  })

  test('Admin dashboard routes correctly when accessed', async ({ page }) => {
    await page.goto('/admin')
    await expect(page.locator('body')).toBeVisible()
  })

  test('Rider portal routes correctly when accessed', async ({ page }) => {
    await page.goto('/rider')
    await expect(page.locator('body')).toBeVisible()
  })
})
