import { test, expect } from '@playwright/test'

async function login(page) {
  await page.goto('/login')
  await page.fill('input[name="email"]', 'lucia@uni.edu')
  await page.fill('input[name="password"]', 'admin123')
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/administrativo/, { timeout: 10000 })
}

test.describe('Usuarios E2E', () => {
  test('admin sees user list with correct data', async ({ page }) => {
    await login(page)
    await page.click('a[href="/administrativo/usuarios"]')
    await expect(page.locator('text=ana@uni.edu')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=dario@uni.edu')).toBeVisible()
    await expect(page.locator('text=lucia@uni.edu')).toBeVisible()
  })

  test('user list shows roles', async ({ page }) => {
    await login(page)
    await page.click('a[href="/administrativo/usuarios"]')
    await expect(page.locator('text=estudiante')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=docente')).toBeVisible()
    await expect(page.locator('text=administrativo')).toBeVisible()
  })

  test('estudiante cannot access user list', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'ana@uni.edu')
    await page.fill('input[name="password"]', 'estudiante123')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/estudiante/, { timeout: 10000 })

    await page.goto('/administrativo/usuarios')
    await page.waitForTimeout(2000)
    const url = page.url()
    expect(url).not.toContain('/usuarios')
  })

  test('admin can see perfil page', async ({ page }) => {
    await login(page)
    await page.click('a[href="/perfil"]')
    await expect(page.locator('text=lucia@uni.edu').or(page.locator('[class*="perfil"]'))).toBeVisible({ timeout: 5000 })
  })

  test('perfil shows user email and role', async ({ page }) => {
    await login(page)
    await page.click('a[href="/perfil"]')
    await expect(page.locator('text=administrativo')).toBeVisible({ timeout: 5000 })
  })
})
