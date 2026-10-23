import { defineConfig } from '@playwright/test';
// iPhone 16 Pro Max viewport (440x956 @3x), WebKit.
export default defineConfig({
  testDir: 'e2e', timeout: 120_000, reporter: 'list',
  use: { browserName: 'webkit', viewport: { width: 440, height: 956 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, baseURL: 'http://localhost:4174/' },
  webServer: { command: 'npx vite preview --port 4174 --strictPort', port: 4174, reuseExistingServer: true },
});
