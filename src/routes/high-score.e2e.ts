import { expect, test, type Page } from '@playwright/test'

const LOADING_OVERLAY_TIMEOUT_MS = 8000
const HIGH_SCORE_STORAGE_KEY = 'mnemecha_high_score'
const HIGH_SCORE_ROUND_KEY = 'mnemecha_high_score_round'
const HIGH_SCORE_CHECK_KEY = 'mnemecha_high_score_check'
const LEGACY_HIGH_SCORE_STORAGE_KEY = 'simon_high_score'
const LEGACY_HIGH_SCORE_ROUND_KEY = 'simon_high_score_round'
const LEGACY_HIGH_SCORE_CHECK_KEY = 'simon_high_score_check'
const LEGACY_SAMPLE_SCORE = 4321
const LEGACY_SAMPLE_ROUND = 2
const CHECK_SEED = 0x9e_37_79_b9
const SAMPLE_HIGH_SCORE = 5000
const SAMPLE_HIGH_ROUND = 3
const GAME_SCENE_SELECTOR = '[data-testid="game-scene"]'

const HIGH_SCORE_KEYS = [
	HIGH_SCORE_STORAGE_KEY,
	HIGH_SCORE_ROUND_KEY,
	HIGH_SCORE_CHECK_KEY,
] as const
const LEGACY_KEYS = [
	LEGACY_HIGH_SCORE_STORAGE_KEY,
	LEGACY_HIGH_SCORE_ROUND_KEY,
	LEGACY_HIGH_SCORE_CHECK_KEY,
] as const

function compute_check_value(score: number, round: number): number {
	/* eslint-disable no-bitwise -- bitwise hash mixing matches the runtime check-value algorithm */
	return (Math.imul(score + 1, CHECK_SEED) ^ Math.imul(round + 1, CHECK_SEED >>> 1)) >>> 0
	/* eslint-enable no-bitwise */
}

async function set_storage(page: Page, entries: Array<[string, number]>): Promise<void> {
	await page.evaluate((pairs) => {
		for (const [storage_key, value] of pairs) localStorage.setItem(storage_key, String(value))
	}, entries)
}

async function remove_storage(page: Page, keys: ReadonlyArray<string>): Promise<void> {
	await page.evaluate((storage_keys) => {
		for (const storage_key of storage_keys) localStorage.removeItem(storage_key)
	}, keys)
}

async function get_storage(page: Page, keys: ReadonlyArray<string>): Promise<Array<string | null>> {
	return await page.evaluate(
		(storage_keys) => storage_keys.map((storage_key) => localStorage.getItem(storage_key)),
		keys,
	)
}

test('high score persists in localStorage across page reload', async ({ page }) => {
	const stored_check = compute_check_value(SAMPLE_HIGH_SCORE, SAMPLE_HIGH_ROUND)

	await page.goto('/')
	await set_storage(page, [
		[HIGH_SCORE_STORAGE_KEY, SAMPLE_HIGH_SCORE],
		[HIGH_SCORE_ROUND_KEY, SAMPLE_HIGH_ROUND],
		[HIGH_SCORE_CHECK_KEY, stored_check],
	])
	await page.goto('/')
	const stored = await get_storage(page, HIGH_SCORE_KEYS)

	expect(stored).toEqual([
		String(SAMPLE_HIGH_SCORE),
		String(SAMPLE_HIGH_ROUND),
		String(stored_check),
	])
})

test('legacy simon_* high score keys are migrated to mnemecha_* on first load', async ({
	page,
}) => {
	const legacy_check = compute_check_value(LEGACY_SAMPLE_SCORE, LEGACY_SAMPLE_ROUND)

	await page.goto('/')
	await remove_storage(page, HIGH_SCORE_KEYS)
	await set_storage(page, [
		[LEGACY_HIGH_SCORE_STORAGE_KEY, LEGACY_SAMPLE_SCORE],
		[LEGACY_HIGH_SCORE_ROUND_KEY, LEGACY_SAMPLE_ROUND],
		[LEGACY_HIGH_SCORE_CHECK_KEY, legacy_check],
	])
	await page.goto('/')
	await expect(page.locator(GAME_SCENE_SELECTOR)).toBeVisible({
		timeout: LOADING_OVERLAY_TIMEOUT_MS,
	})
	const migrated = await get_storage(page, [...HIGH_SCORE_KEYS, ...LEGACY_KEYS])

	expect(migrated).toEqual([
		String(LEGACY_SAMPLE_SCORE),
		String(LEGACY_SAMPLE_ROUND),
		String(legacy_check),
		// eslint-disable-next-line unicorn/no-null -- legacy keys must be cleared after migration
		null,
		// eslint-disable-next-line unicorn/no-null -- legacy keys must be cleared after migration
		null,
		// eslint-disable-next-line unicorn/no-null -- legacy keys must be cleared after migration
		null,
	])
})
