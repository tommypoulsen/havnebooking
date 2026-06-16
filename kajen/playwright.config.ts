import { defineConfig, devices } from '@playwright/test'
import { config as loadEnv } from 'dotenv'
import { existsSync } from 'fs'

// Use .env.test.local (local Supabase) when present, otherwise fall back to .env.local.
// Copy .env.test.local.example → .env.test.local and fill in values from `npx supabase status`.
const envPath = existsSync('.env.test.local') ? '.env.test.local' : '.env.local'
loadEnv({ path: envPath })

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  globalSetup: './tests/e2e/global-setup.ts',
  globalTeardown: './tests/e2e/global-teardown.ts',
  use: {
    baseURL: 'http://hundested.localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000/login',
    reuseExistingServer: !process.env.CI,
    // Forward test env vars into the dev server so Next.js connects to the right
    // Supabase instance regardless of what .env.local contains.
    env: {
      NEXT_PUBLIC_SUPABASE_URL:      process.env.NEXT_PUBLIC_SUPABASE_URL      ?? '',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
      SUPABASE_SERVICE_ROLE_KEY:     process.env.SUPABASE_SERVICE_ROLE_KEY     ?? '',
      NEXT_PUBLIC_APP_DOMAIN:        process.env.NEXT_PUBLIC_APP_DOMAIN        ?? '',
    },
  },
})
