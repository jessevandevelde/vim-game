import { defineConfig, devices } from '@playwright/test';

const port = process.env['PLAYWRIGHT_PORT'] ?? '4200';
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 0,
  reporter: 'line',
  use: { baseURL, trace: 'retain-on-failure', ...devices['Desktop Chrome'] },
  webServer: process.env['PLAYWRIGHT_NO_SERVER']
    ? undefined
    : {
        command: `npm start -- --host 127.0.0.1 --port ${port}`,
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
