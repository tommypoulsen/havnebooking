import { test, expect } from '@playwright/test'

const ADMIN_EMAIL    = process.env.E2E_ADMIN_EMAIL    ?? 'e2e-admin@hundested-test.dk'
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'e2e-testpass-123'

test('admin can log in and view the bookings list', async ({ page }) => {
  // Log in
  await page.goto('/login')
  await page.getByLabel('E-mail').fill(ADMIN_EMAIL)
  await page.getByLabel('Adgangskode').fill(ADMIN_PASSWORD)
  await page.getByRole('button', { name: 'Log ind' }).click()

  // Login redirects to /admin/timeslots
  await page.waitForURL('/admin/timeslots', { timeout: 10_000 })
  await expect(page.getByRole('heading', { name: 'Tidspunkter' })).toBeVisible()

  // Navigate to bookings
  await page.goto('/admin/bookings')
  await expect(page.getByRole('heading', { name: 'Bookinger' })).toBeVisible()

  // Table headers are present
  await expect(page.getByRole('columnheader', { name: 'Kunde' })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'Total' })).toBeVisible()
})
