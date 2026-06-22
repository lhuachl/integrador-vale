import { test, expect } from '@playwright/test'

const USERS = {
  estudiante: { email: 'ana@uni.edu', password: 'estudiante123' },
  docente: { email: 'dario@uni.edu', password: 'docente123' },
  coordinador: { email: 'carlos@uni.edu', password: 'coord123' },
  administrativo: { email: 'lucia@uni.edu', password: 'admin123' },
}

async function login(page, user: keyof typeof USERS) {
  await page.goto('/login')
  await page.fill('input[name="email"]', USERS[user].email)
  await page.fill('input[name="password"]', USERS[user].password)
  await page.click('button[type="submit"]')
  await page.waitForURL(/^\/(?!login)/, { timeout: 10000 })
}

test.describe('Auth E2E', () => {
  test('login page renders', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('h1')).toContainText('Avior SIU')
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
  })

  test('redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login/)
  })

  test('estudiante login redirects to cursos', async ({ page }) => {
    await login(page, 'estudiante')
    await expect(page).toHaveURL(/\/estudiante\/cursos/)
    await expect(page.locator('h1, h2, [class*="page-header"]').first()).toBeVisible()
  })

  test('administrativo login redirects to usuarios', async ({ page }) => {
    await login(page, 'administrativo')
    await expect(page).toHaveURL(/\/administrativo\/usuarios/)
  })

  test('docente login redirects to grupos', async ({ page }) => {
    await login(page, 'docente')
    await expect(page).toHaveURL(/\/docente\/grupos/)
  })

  test('coordinador login redirects to grupos', async ({ page }) => {
    await login(page, 'coordinador')
    await expect(page).toHaveURL(/\/coordinador\/grupos/)
  })

  test('invalid credentials show error', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'ana@uni.edu')
    await page.fill('input[name="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    await expect(page.locator('text=inválidas').or(page.locator('[class*="error"]'))).toBeVisible({ timeout: 5000 })
  })

  test('logout redirects to login', async ({ page }) => {
    await login(page, 'estudiante')
    await page.click('[aria-label="Cerrar sesión"]')
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 })
  })

  test('session persists across navigation', async ({ page }) => {
    await login(page, 'estudiante')
    await page.click('a[href="/perfil"]')
    await expect(page.locator('text=ana@uni.edu').or(page.locator('[class*="profile"]'))).toBeVisible({ timeout: 5000 })
  })
})
