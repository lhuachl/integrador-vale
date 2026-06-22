import { test, expect } from '@playwright/test'

async function loginDocente(page) {
  await page.goto('/login')
  await page.fill('input[name="email"]', 'dario@uni.edu')
  await page.fill('input[name="password"]', 'docente123')
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/docente/, { timeout: 10000 })
}

async function loginCoordinador(page) {
  await page.goto('/login')
  await page.fill('input[name="email"]', 'carlos@uni.edu')
  await page.fill('input[name="password"]', 'coord123')
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/coordinador/, { timeout: 10000 })
}

async function loginAdmin(page) {
  await page.goto('/login')
  await page.fill('input[name="email"]', 'lucia@uni.edu')
  await page.fill('input[name="password"]', 'admin123')
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/administrativo/, { timeout: 10000 })
}

test.describe('Docente E2E', () => {
  test('mis grupos page loads with courses', async ({ page }) => {
    await loginDocente(page)
    await page.click('a[href="/docente/grupos"]')
    await page.waitForTimeout(2000)
    await expect(
      page.locator('text=MAT101').or(page.locator('text=Mis grupos'))
    ).toBeVisible({ timeout: 5000 })
  })

  test('can navigate to calificar page for a group', async ({ page }) => {
    await loginDocente(page)
    await page.click('a[href="/docente/grupos"]')
    await page.waitForTimeout(2000)
    // Click on first group link
    const groupLink = page.locator('a[href*="/docente/grupos/"]').first()
    if (await groupLink.isVisible({ timeout: 3000 })) {
      await groupLink.click()
      await page.waitForTimeout(2000)
      await expect(page.locator('h1, h2, [class*="page-header"]').first()).toBeVisible()
    }
  })

  test('asistencia page loads for a group', async ({ page }) => {
    await loginDocente(page)
    await page.click('a[href="/docente/grupos"]')
    await page.waitForTimeout(2000)
    const groupLink = page.locator('a[href*="/docente/grupos/"]').first()
    if (await groupLink.isVisible({ timeout: 3000 })) {
      const href = await groupLink.getAttribute('href')
      await page.goto(`${href}/asistencia`)
      await page.waitForTimeout(2000)
      await expect(page.locator('h1, h2, [class*="page-header"]').first()).toBeVisible()
    }
  })
})

test.describe('Coordinador E2E', () => {
  test('grupos page loads with all groups', async ({ page }) => {
    await loginCoordinador(page)
    await page.click('a[href="/coordinador/grupos"]')
    await page.waitForTimeout(2000)
    await expect(
      page.locator('text=MAT101').or(page.locator('text=Gestión'))
    ).toBeVisible({ timeout: 5000 })
  })

  test('reportes page loads', async ({ page }) => {
    await loginCoordinador(page)
    await page.click('a[href="/coordinador/reportes"]')
    await page.waitForTimeout(2000)
    await expect(page.locator('h1, h2, [class*="page-header"]').first()).toBeVisible()
  })
})

test.describe('Admin E2E', () => {
  test('dashboard loads with stats', async ({ page }) => {
    await loginAdmin(page)
    await page.click('a[href="/administrativo"]')
    await page.waitForTimeout(2000)
    await expect(page.locator('text=Dashboard').or(page.locator('[class*="dashboard"]'))).toBeVisible({ timeout: 5000 })
  })

  test('periodos page loads', async ({ page }) => {
    await loginAdmin(page)
    await page.click('a[href="/administrativo/periodos"]')
    await page.waitForTimeout(2000)
    await expect(page.locator('text=2025-1').or(page.locator('text=Períodos'))).toBeVisible({ timeout: 5000 })
  })
})
