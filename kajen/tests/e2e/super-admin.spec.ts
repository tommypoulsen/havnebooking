import { test, expect } from '@playwright/test'

const SUPER_EMAIL    = process.env.E2E_SUPER_EMAIL    ?? 'super@havnebooking.dk'
const SUPER_PASSWORD = process.env.E2E_SUPER_PASSWORD ?? 'changeme123'

test('super-admin can create a tenant user', async ({ page }) => {
  // Log in as super-admin
  await page.goto('/login')
  await page.getByLabel('E-mail').fill(SUPER_EMAIL)
  await page.getByLabel('Adgangskode').fill(SUPER_PASSWORD)
  await page.getByRole('button', { name: 'Log ind' }).click()
  await page.waitForURL('**/admin/**', { timeout: 10_000 })

  // Navigate to tenants
  await page.goto('/tenants')
  await expect(page.getByRole('heading', { name: 'Tenanter' })).toBeVisible()

  // Open the Hundested tenant — filter by row name to avoid picking a different tenant
  await page.getByRole('row').filter({ hasText: /Hundested/i }).getByRole('link', { name: /Rediger/ }).click()
  await page.waitForURL(/\/tenants\//, { timeout: 10_000 })
  await expect(page.getByRole('heading', { name: /Hundested/i })).toBeVisible({ timeout: 10_000 })

  // Brugere section is present
  await expect(page.getByRole('heading', { name: 'Brugere' })).toBeVisible()

  // Fill in the create user form — scoped to avoid conflicts with tenant edit fields
  const createUserForm = page.getByRole('form', { name: 'Opret bruger' })
  const uniqueEmail = `e2e-staff-${Date.now()}@hundested-test.dk`
  await createUserForm.getByLabel('Navn').fill('E2E Medarbejder')
  await createUserForm.getByLabel('E-mail').fill(uniqueEmail)
  await createUserForm.getByLabel('Adgangskode').fill('testpass-e2e-123')
  await createUserForm.getByLabel('Rolle').selectOption('staff')
  await createUserForm.getByRole('button', { name: 'Opret bruger' }).click()

  // New user appears in the list
  await expect(page.getByText(uniqueEmail)).toBeVisible({ timeout: 10_000 })
})
