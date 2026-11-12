import { defineConfig, devices } from '@playwright/test';

const PORT = 5173;
// WebKit needs system libraries that are not available in every sandbox; opt in with PW_WEBKIT=1 (CI, macOS).
const withWebkit = process.env.PW_WEBKIT === '1';

const desktop = { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } };
const mobileChromium = { ...devices['Pixel 7'] };
const reduced = { contextOptions: { reducedMotion: 'reduce' as const } };

export default defineConfig({
  testDir: './e2e',
  // Some sandboxed mounts hang on clearing the output dir; allow relocating it.
  outputDir: process.env.PW_OUTPUT_DIR ?? 'test-results',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 3,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: { baseURL: `http://localhost:${PORT}`, trace: 'retain-on-failure' },
  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [
    { name: 'desktop-chromium', use: desktop },
    { name: 'mobile-chromium', use: mobileChromium },
    { name: 'desktop-chromium-reduced', use: { ...desktop, ...reduced } },
    { name: 'mobile-chromium-reduced', use: { ...mobileChromium, ...reduced } },
    ...(withWebkit
      ? [
          { name: 'mobile-webkit', use: { ...devices['iPhone 14'] } },
          { name: 'mobile-webkit-reduced', use: { ...devices['iPhone 14'], ...reduced } },
        ]
      : []),
  ],
});
