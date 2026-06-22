import { test, expect } from '@playwright/test'

async function loginEstudiante(page) {
  await page.goto('/login')
  await page.fill('input[name="email"]', 'ana@uni.edu')
  await page.fill('input[name="password"]', 'estudiante123')
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/estudiante/, { timeout: 10000 })
}

test.describe('Estudiante Flujo E2E', () => {
  test('cursos page shows inscripciones', async ({ page }) => {
    await loginEstudiante(page)
    await page.click('a[href="/estudiante/cursos"]')
    await page.waitForTimeout(2000)
    // Should show at least one course or empty state
    await expect(
      page.locator('text=MAT101').or(page.locator('text=Sin inscripciones'))
    ).toBeVisible({ timeout: 5000 })
  })

  test('calificaciones page loads', async ({ page }) => {
    await loginEstudiante(page)
    await page.click('a[href="/estudiante/calificaciones"]')
    await page.waitForTimeout(2000)
    await expect(page.locator('h1, h2, [class*="page-header"]').first()).toBeVisible()
  })

  test('inscripciones page shows available groups', async ({ page }) => {
    await loginEstudiante(page)
    await page.click('a[href="/estudiante/inscripciones"]')
    await page.waitForTimeout(2000)
    await expect(page.locator('h1, h2, [class*="page-header"]').first()).toBeVisible()
  })

  test('horario page loads', async ({ page }) => {
    await loginEstudiante(page)
    await page.click('a[href="/estudiante/horario"]')
    await page.waitForTimeout(2000)
    await expect(page.locator('h1, h2, [class*="page-header"]').first()).toBeVisible()
  })

  test('progreso page shows program progress', async ({ page }) => {
    await loginEstudiante(page)
    await page.click('a[href="/estudiante/progreso"]')
    await page.waitForTimeout(2000)
    await expect(
      page.locator('text=Ingeniería').or(page.locator('text=Progreso'))
    ).toBeVisible({ timeout: 5000 })
  })
})
