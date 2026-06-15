import { test, expect } from '@playwright/test'

const SUPER_EMAIL    = process.env.E2E_SUPER_EMAIL    ?? 'super@havnebooking.dk'
const SUPER_PASSWORD = process.env.E2E_SUPER_PASSWORD ?? 'changeme123'

test('super-admin can create a tenant user', async ({ page }) => {
  // Log in as super-admin
  await page.goto('/login')
  await page.locator('input[name="email"]').fill(SUPER_EMAIL)
  await page.locator('input[name="password"]').fill(SUPER_PASSWORD)
  await page.getByRole('button', { name: 'Log ind' }).click()

  // Navigate to tenants (middleware redirects / → /tenants for super_admin)
  await page.goto('/tenants')
  await expect(page.getByRole('heading', { name: 'Tenanter' })).toBeVisible()

  // Open the Hundested tenant
  await page.getByRole('link', { name: /Rediger/ }).first().click()
  await expect(page.getByRole('heading', { name: /Hundested/i })).toBeVisible()

  // Brugere section is present
  await expect(page.getByRole('heading', { name: 'Brugere' })).toBeVisible()

  // Fill in the create user form
  const uniqueEmail = `e2e-staff-${Date.now()}@hundested-test.dk`
  await page.locator('input[name="full_name"]').fill('E2E Medarbejder')
  await page.locator('input[name="email"]').fill(uniqueEmail)
  await page.locator('input[name="password"]').fill('testpass-e2e-123')
  await page.locator('select[name="role"]').selectOption('staff')
  await page.getByRole('button', { name: 'Opret bruger' }).click()

  // New user appears in the list
  await expect(page.getByText(uniqueEmail)).toBeVisible({ timeout: 10_000 })
})
