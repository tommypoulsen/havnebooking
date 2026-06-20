import { test, expect } from '@playwright/test'

test('booking with add-on: sejlbåd + med mast triggers mastetillæg', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Hundested Bådeværft' })).toBeVisible()

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

  // Step: time slot
  await expect(page.getByRole('heading', { name: 'Vælg tidspunkt' })).toBeVisible()
  await page.getByTestId('time-slot').first().click()
  await page.getByRole('button', { name: 'Næste' }).click()

  // Step: post-fields — choose Sejlbåd, then Med mast
  await expect(page.getByRole('heading', { name: 'Om din båd' })).toBeVisible()
  await page.getByLabel('Bådtype').selectOption('sejlbaad')
  // Conditional mast field should appear after selecting Sejlbåd
  await expect(page.getByLabel('Mast')).toBeVisible()
  await page.getByLabel('Mast').selectOption('med_mast')

  // Verify PricePanel shows Mastetillæg add-on line (desktop sidebar)
  await expect(page.getByText('Mastetillæg')).toBeVisible()

  await page.getByRole('button', { name: 'Næste' }).click()

  // Step: contact info
  await expect(page.getByRole('heading', { name: 'Dine oplysninger' })).toBeVisible()
  await page.getByLabel('Navn').fill('Test Sejler')
  await page.getByLabel('E-mail').fill('e2e-addon@example.com')
  await page.getByLabel('Telefon').fill('12345678')
  await page.getByRole('button', { name: 'Næste' }).click()

  // Step: summary — verify correct total
  await expect(page.getByRole('heading', { name: 'Opsummering' })).toBeVisible()
  await expect(page.getByTestId('booking-summary').getByText('Kranløft')).toBeVisible()
  await expect(page.getByTestId('booking-summary').getByText('Sejlbåd')).toBeVisible()

  // Pay — dev bypass confirms immediately
  await page.getByRole('button', { name: 'Gå til betaling' }).click()
  await page.waitForURL(/\/confirmation/, { timeout: 15_000 })
  await expect(page.getByRole('heading', { name: 'Tak for din booking' })).toBeVisible({ timeout: 10_000 })
})

test('booking with vinteropbevaring triggers multiple add-ons', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: /kranløft/i }).first().click()
  await page.waitForURL(/\/book\/[0-9a-f-]+$/, { timeout: 10_000 })

  // Step: pre-fields — select vinteropbevaring
  await expect(page.getByRole('heading', { name: 'Oplysninger' })).toBeVisible({ timeout: 10_000 })
  await page.getByLabel('Formål').selectOption('vinteropbevaring')
  await page.getByRole('button', { name: 'Næste' }).click()

  // Step: size
  await page.getByRole('button', { name: /0.3 ton/i }).click()
  await page.getByRole('button', { name: 'Næste' }).click()

  // Step: time slot
  await page.getByTestId('time-slot').first().click()
  await page.getByRole('button', { name: 'Næste' }).click()

  // Step: post-fields — Motorbåd (no mast field)
  await page.getByLabel('Bådtype').selectOption('motorbaad')

  // PricePanel should show Stativleje (motorbåd) and Transport add-ons
  await expect(page.getByText('Stativleje (motorbåd)')).toBeVisible()
  await expect(page.getByText('Transport')).toBeVisible()
  // Mast field must NOT appear for Motorbåd
  await expect(page.getByLabel('Mast')).not.toBeVisible()

  await page.getByRole('button', { name: 'Næste' }).click()

  // Contact info
  await page.getByLabel('Navn').fill('Test Motorist')
  await page.getByLabel('E-mail').fill('e2e-vinter@example.com')
  await page.getByLabel('Telefon').fill('87654321')
  await page.getByRole('button', { name: 'Næste' }).click()

  // Pay
  await page.getByRole('button', { name: 'Gå til betaling' }).click()
  await page.waitForURL(/\/confirmation/, { timeout: 15_000 })
  await expect(page.getByRole('heading', { name: 'Tak for din booking' })).toBeVisible({ timeout: 10_000 })
})
