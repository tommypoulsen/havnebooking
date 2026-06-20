import { test, expect } from '@playwright/test'

test('visitor can complete a kranløft booking', async ({ page }) => {
  // Homepage — verify correct tenant loaded
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Hundested Bådeværft' })).toBeVisible()

  // Click the Kranløft service card
  await page.getByRole('link', { name: /kranløft/i }).first().click()
  await page.waitForURL(/\/book\/[0-9a-f-]+$/, { timeout: 10_000 })

  // Step: pre-fields — select lift type
  await expect(page.getByRole('heading', { name: 'Oplysninger' })).toBeVisible({ timeout: 10_000 })
  await page.getByLabel('Formål').selectOption('kun_kranloeft')
  await page.getByRole('button', { name: 'Næste' }).click()

  // Step: size category
  await expect(page.getByRole('heading', { name: 'Vælg størrelse' })).toBeVisible()
  await page.getByRole('button', { name: /0.3 ton/i }).click()
  await page.getByRole('button', { name: 'Næste' }).click()

  // Step: time slot — pick first available slot
  await expect(page.getByRole('heading', { name: 'Vælg tidspunkt' })).toBeVisible()
  await page.getByTestId('time-slot').first().click()
  await page.getByRole('button', { name: 'Næste' }).click()

  // Step: form fields — choose Motorbåd (no conditional mast field)
  await expect(page.getByRole('heading', { name: 'Om din båd' })).toBeVisible()
  await page.getByLabel('Bådtype').selectOption('motorbaad')
  await page.getByRole('button', { name: 'Næste' }).click()

  // Step: contact info
  await expect(page.getByRole('heading', { name: 'Dine oplysninger' })).toBeVisible()
  await page.getByLabel('Navn').fill('Test Testesen')
  await page.getByLabel('E-mail').fill('e2e-booking@example.com')
  await page.getByLabel('Telefon').fill('12345678')
  await page.getByRole('button', { name: 'Næste' }).click()

  // Step: summary — verify key fields are shown
  const summary = page.getByTestId('booking-summary')
  await expect(page.getByRole('heading', { name: 'Opsummering' })).toBeVisible()
  await expect(summary.getByText('Kranløft')).toBeVisible()
  await expect(summary.getByText('Motorbåd')).toBeVisible()

  // Pay — dev bypass (no QUICKPAY_API_KEY) confirms immediately
  await page.getByRole('button', { name: 'Gå til betaling' }).click()
  await page.waitForURL(/\/confirmation/, { timeout: 15_000 })
  await page.waitForLoadState('networkidle')

  await expect(page.getByRole('heading', { name: 'Tak for din booking' })).toBeVisible({ timeout: 10_000 })
  await expect(page.getByText('Ordredetaljer')).toBeVisible()
})
