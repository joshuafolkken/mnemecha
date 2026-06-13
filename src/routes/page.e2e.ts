import { readFileSync } from 'node:fs'
import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const { version } = JSON.parse(
	readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
) as { version: string }

const LOADING_OVERLAY_TIMEOUT_MS = 8000
const FULLSCREEN_NOT_CALLED_WAIT_MS = 200
const TOUCH_PRIMARY_QUERY = '(hover: none) and (pointer: coarse)'
const READY_PROGRESS_VALUE = 100
const GAME_SCENE_SELECTOR = '[data-testid="game-scene"]'
const LOADING_OVERLAY_SELECTOR = '[data-testid="loading-overlay"]'
const PROGRESS_BAR_SELECTOR = '[data-testid="loading-overlay"] progress.bar'
const CLICK_HINT_SELECTOR = '.click-hint'

async function stub_touch_primary(page: Page, is_touch: boolean): Promise<void> {
	await page.addInitScript(
		([query, matches]) => {
			const original = globalThis.matchMedia.bind(globalThis)

			globalThis.matchMedia = function patched(input: string): MediaQueryList {
				if (input === query) {
					const noop = (): void => {
						/* no-op */
					}

					const patched_list: MediaQueryList = {
						matches,
						media: input,
						// eslint-disable-next-line unicorn/no-null -- MediaQueryList.onchange is typed as nullable by the DOM API
						onchange: null,
						addEventListener: noop,
						removeEventListener: noop,
						addListener: noop,
						removeListener: noop,
						dispatchEvent: () => false,
					}

					return patched_list
				}

				return original(input)
			}
		},
		[TOUCH_PRIMARY_QUERY, is_touch] as const,
	)
}

async function probe_fullscreen_request(page: Page): Promise<boolean> {
	return await page.evaluate(
		async ([selector, wait_ms]) =>
			await new Promise<boolean>((resolve) => {
				const scene = document.querySelector<HTMLElement>(selector)

				if (!scene) {
					resolve(false)

					return
				}

				let did_request = false

				scene.requestFullscreen = async function (): Promise<void> {
					await Promise.resolve()
					did_request = true
					resolve(did_request)
				}

				scene.click()
				setTimeout(() => {
					resolve(did_request)
				}, wait_ms)
			}),
		[GAME_SCENE_SELECTOR, FULLSCREEN_NOT_CALLED_WAIT_MS] as const,
	)
}

test('page response includes HTTP security headers', async ({ page }) => {
	const response = await page.goto('/')
	const headers = response?.headers() ?? {}

	expect(headers['x-frame-options']).toBe('SAMEORIGIN')
	expect(headers['x-content-type-options']).toBe('nosniff')
	expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
	expect(headers['permissions-policy']).toContain('camera=()')
	expect(headers['content-security-policy']).toContain("default-src 'self'")
})

test('game scene renders immediately with canvas', async ({ page }) => {
	await page.goto('/')
	await expect(page.locator(GAME_SCENE_SELECTOR)).toBeVisible()
	await expect(page.locator('[data-testid="game-scene"] canvas')).toBeVisible()
})

const OVERLAY_VISIBLE_CASES = [
	{ title: 'is visible immediately on page load', selector: LOADING_OVERLAY_SELECTOR },
	{ title: 'displays the logo svg', selector: `${LOADING_OVERLAY_SELECTOR} svg.logo` },
] as const

for (const visible_case of OVERLAY_VISIBLE_CASES) {
	test(`loading overlay ${visible_case.title}`, async ({ page }) => {
		await page.goto('/')
		await expect(page.locator(visible_case.selector)).toBeVisible()
	})
}

const OVERLAY_TEXT_CASES = [
	{ title: 'displays Joshua Folkken below the logo', sub: '.brand', text: 'Joshua Folkken' },
	{ title: 'displays game title below the brand', sub: '.game-title', text: 'MNEMECHA' },
	{ title: 'displays game version below the brand', sub: '.game-version', text: `v${version}` },
] as const

for (const overlay_case of OVERLAY_TEXT_CASES) {
	test(`loading overlay ${overlay_case.title}`, async ({ page }) => {
		await page.goto('/')
		await expect(page.locator(`${LOADING_OVERLAY_SELECTOR} ${overlay_case.sub}`)).toHaveText(
			overlay_case.text,
		)
	})
}

const OVERLAY_READY_CASES = [
	{ title: 'reaches 100% progress once the scene is ready', sub: '.progress', text: '100%' },
	{ title: 'shows ready text once the scene is ready', sub: '.status', text: 'READY' },
] as const

for (const ready_case of OVERLAY_READY_CASES) {
	test(`loading overlay ${ready_case.title}`, async ({ page }) => {
		await page.goto('/')
		await expect(page.locator(`${LOADING_OVERLAY_SELECTOR} ${ready_case.sub}`)).toHaveText(
			ready_case.text,
			{ timeout: LOADING_OVERLAY_TIMEOUT_MS },
		)
	})
}

test('loading overlay disappears once the scene is ready', async ({ page }) => {
	await page.goto('/')
	await expect(page.locator(LOADING_OVERLAY_SELECTOR)).toBeHidden({
		timeout: LOADING_OVERLAY_TIMEOUT_MS,
	})
	await expect(page.locator(GAME_SCENE_SELECTOR)).toBeVisible()
})

test('first click on the game scene does not toggle cyber mode', async ({ page }) => {
	await page.goto('/')
	await expect(page.locator(GAME_SCENE_SELECTOR)).toBeVisible()
	const glow_locator = page.locator('[data-testid="cyber-glow"]')
	const initial_glow_count = await glow_locator.count()

	await page.locator(GAME_SCENE_SELECTOR).click()
	const after_glow_count = await glow_locator.count()

	expect(after_glow_count).toBe(initial_glow_count)
})

const FULLSCREEN_CASES = [
	{ title: 'is requested on touch-primary devices when start hint is clicked', is_touch: true },
	{ title: 'is NOT requested on desktop devices when start hint is clicked', is_touch: false },
] as const

for (const fullscreen_case of FULLSCREEN_CASES) {
	test(`fullscreen ${fullscreen_case.title}`, async ({ page }) => {
		await stub_touch_primary(page, fullscreen_case.is_touch)
		await page.goto('/')
		await expect(page.locator(GAME_SCENE_SELECTOR)).toBeVisible()

		expect(await probe_fullscreen_request(page)).toBe(fullscreen_case.is_touch)
	})
}

test('pseudo-fullscreen class is applied when native API is unavailable on touch devices', async ({
	page,
}) => {
	await stub_touch_primary(page, true)
	await page.goto('/')
	await expect(page.locator(GAME_SCENE_SELECTOR)).toBeVisible()

	await page.evaluate((selector) => {
		const scene = document.querySelector<HTMLElement>(selector)
		if (!scene) return
		Object.defineProperty(scene, 'requestFullscreen', { value: undefined, configurable: true })
		Object.defineProperty(scene, 'webkitRequestFullscreen', {
			value: undefined,
			configurable: true,
		})
		scene.click()
	}, GAME_SCENE_SELECTOR)

	await expect(page.locator(GAME_SCENE_SELECTOR)).toHaveClass(/pseudo-fullscreen/u)
})

test('game scene has role="application" for screen reader keyboard pass-through', async ({
	page,
}) => {
	await page.goto('/')
	await expect(page.locator(GAME_SCENE_SELECTOR)).toHaveAttribute('role', 'application')
})

const START_KEYS = ['Enter', 'Space'] as const

for (const key of START_KEYS) {
	test(`game scene can be started with ${key} key after focusing via Tab`, async ({ page }) => {
		await page.goto('/')
		await expect(page.locator(GAME_SCENE_SELECTOR)).toBeVisible()
		await page.keyboard.press('Tab')
		await page.keyboard.press(key)
		await expect(page.locator(CLICK_HINT_SELECTOR)).toHaveCount(0)
	})
}

test('loading overlay uses native progress element for accessible progress', async ({ page }) => {
	await page.goto('/')
	await expect(page.locator(PROGRESS_BAR_SELECTOR)).toBeVisible()
	await expect(page.locator(PROGRESS_BAR_SELECTOR)).toHaveAttribute('max', '100')
})

test('loading overlay progress element reaches 100 when the scene is ready', async ({ page }) => {
	await page.goto('/')
	await expect(page.locator(PROGRESS_BAR_SELECTOR)).toHaveJSProperty(
		'value',
		READY_PROGRESS_VALUE,
		{
			timeout: LOADING_OVERLAY_TIMEOUT_MS,
		},
	)
})

test('page has no critical or serious accessibility violations', async ({ page }) => {
	await page.goto('/')
	const results = await new AxeBuilder({ page }).exclude('canvas').analyze()
	const violations = results.violations.filter(
		(violation) => violation.impact === 'critical' || violation.impact === 'serious',
	)

	expect(violations).toHaveLength(0)
})

test('game scene loads without shadow-related WebGL errors', async ({ page }) => {
	const errors: Array<string> = []

	page.on('pageerror', (error) => errors.push(error.message))
	await page.goto('/')
	await expect(page.locator(LOADING_OVERLAY_SELECTOR)).toBeHidden({
		timeout: LOADING_OVERLAY_TIMEOUT_MS,
	})
	const webgl_errors = errors.filter(
		(e) => e.toLowerCase().includes('shadow') || e.toLowerCase().includes('webgl'),
	)

	expect(webgl_errors).toHaveLength(0)
})

test('favicon link points to the Mnemecha icon, not the Svelte logo', async ({ page }) => {
	await page.goto('/')
	const icon_href = await page.evaluate(() => {
		const links = document.querySelectorAll<HTMLLinkElement>('link[rel="icon"]')
		const last = [...links].at(-1)

		return last?.getAttribute('href') ?? undefined
	})

	expect(icon_href).toBe('/icon.svg')
})

test('PWA manifest is linked in document head', async ({ page }) => {
	await page.goto('/')
	const manifest_href = await page.evaluate(() => {
		const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')

		return link?.href ?? undefined
	})

	expect(manifest_href).toBeTruthy()
})

test('service worker is ready after page load', async ({ page }) => {
	await page.goto('/')
	const scope = await page.evaluate(async () => {
		if (!('serviceWorker' in navigator)) return undefined
		const reg = await navigator.serviceWorker.ready

		return reg.scope
	})

	expect(scope).toBeTruthy()
})
