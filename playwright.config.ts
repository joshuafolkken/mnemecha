import { defineConfig, devices } from '@playwright/test'

const CI_TIMEOUT = 15_000
const LOCAL_TIMEOUT = 25_000
const TEST_TIMEOUT = 15_000
const EXPECT_TIMEOUT = 5_000
const ACTION_TIMEOUT = 10_000
const NAVIGATION_TIMEOUT = 15_000
const CI_WORKERS = 2
const LOCAL_WORKERS = 1
const CI_RETRIES = 2
const VIEWPORT_WIDTH = 1_280
const VIEWPORT_HEIGHT = 720

const PREVIEW_PORT = 4173

const is_ci = Boolean(process.env['CI'])

export default defineConfig({
	webServer: {
		command: is_ci ? 'pnpm run preview' : 'pnpm run build && pnpm run preview',
		port: PREVIEW_PORT,
		timeout: is_ci ? CI_TIMEOUT : LOCAL_TIMEOUT,
		reuseExistingServer: !is_ci,
	},
	testMatch: '**/*.e2e.ts',
	fullyParallel: true,
	workers: is_ci ? CI_WORKERS : LOCAL_WORKERS,
	retries: is_ci ? CI_RETRIES : 0,
	timeout: TEST_TIMEOUT,
	expect: { timeout: EXPECT_TIMEOUT },
	projects: [
		{
			name: 'chromium',
			use: {
				...devices['Desktop Chrome'],
				viewport: { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT },
				launchOptions: {
					args: ['--disable-dev-shm-usage', '--disable-gpu', ...(is_ci ? ['--no-sandbox'] : [])],
				},
			},
		},
	],
	reporter: is_ci ? [['html'], ['github']] : [['html'], ['list']],
	use: {
		actionTimeout: ACTION_TIMEOUT,
		navigationTimeout: NAVIGATION_TIMEOUT,
		screenshot: is_ci ? 'only-on-failure' : 'off',
		video: is_ci ? 'retain-on-failure' : 'off',
		trace: is_ci ? 'retain-on-failure' : 'off',
	},
})
