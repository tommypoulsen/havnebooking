import { test, expect } from '@playwright/test'

test('visitor can complete a kranløft booking', async ({ page }) => {
  // Homepage
  await page.goto('/')
  await expect(page.getByText('Hundested Bådeværft')).toBeVisible()

  // Click the Kranløft card to go directly to the booking wizard
  await page.getByRole('link', { name: /kranløft/i }).first().click()

  // Step: size category
  await expect(page.getByText('Vælg størrelse')).toBeVisible()
  await page.getByRole('button', { name: /0.3 ton/i }).click()
  await page.getByRole('button', { name: 'Næste' }).click()

  // Step: time slot — pick first slot with available capacity
  await expect(page.getByText('Vælg tidspunkt')).toBeVisible()
  await page.locator('button').filter({ hasText: /[1-9] ledige pladser/ }).first().click()
  await page.getByRole('button', { name: 'Næste' }).click()

  // Step: form fields (boat type) — choose Motorbåd (no conditional mast field)
  await expect(page.getByText('Om din båd')).toBeVisible()
  await page.locator('select').selectOption('motorbaad')
  await page.getByRole('button', { name: 'Næste' }).click()

  // Step: contact info
  await expect(page.getByText('Dine oplysninger')).toBeVisible()
  await page.locator('input[type="text"]').fill('Test Testesen')
  await page.locator('input[type="email"]').fill('e2e-booking@example.com')
  await page.locator('input[type="tel"]').fill('12345678')
  await page.getByRole('button', { name: 'Næste' }).click()

  // Step: summary
  await expect(page.getByText('Opsummering')).toBeVisible()
  await expect(page.getByText('Kranløft')).toBeVisible()
  await expect(page.getByText('Motorbåd')).toBeVisible()

  // Pay — dev bypass (no QUICKPAY_API_KEY) confirms immediately
  await page.getByRole('button', { name: 'Gå til betaling' }).click()
  await page.waitForURL(/\/confirmation/, { timeout: 10_000 })

  await expect(page.getByText('Tak for din booking')).toBeVisible()
  await expect(page.getByText('Ordredetaljer')).toBeVisible()
})
