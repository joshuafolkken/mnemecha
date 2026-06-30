import {
	compute_check,
	create_score,
	load_stored_data,
	migrate_legacy_score_keys,
	score,
	type StorageKeys,
} from '$lib/game/Score.svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const ROUND_1 = 1
const ROUND_5 = 5
const SEQ_1 = 1
const SEQ_5 = 5
const ELAPSED_0 = 0
const ELAPSED_5S = 5000
const ELAPSED_10S = 10_000
const ELAPSED_100S = 100_000

const DEFAULT_KEYS: StorageKeys = {
	score: 'mnemecha_high_score',
	round: 'mnemecha_high_score_round',
	check: 'mnemecha_high_score_check',
}

const LEGACY_SCORE_KEY = 'simon_high_score'
const LEGACY_ROUND_KEY = 'simon_high_score_round'
const LEGACY_CHECK_KEY = 'simon_high_score_check'
const NEW_SCORE_KEY = 'mnemecha_high_score'
const NEW_ROUND_KEY = 'mnemecha_high_score_round'
const NEW_CHECK_KEY = 'mnemecha_high_score_check'

function make_memory_storage(): Storage {
	const store = new Map<string, string>()

	return {
		get length(): number {
			return store.size
		},
		clear(): void {
			store.clear()
		},
		getItem(key: string): string | null {
			return store.has(key) ? (store.get(key) ?? null) : null
		},
		key(index: number): string | null {
			return store.keys().toArray()[index] ?? null
		},
		removeItem(key: string): void {
			store.delete(key)
		},
		setItem(key: string, value: string): void {
			store.set(key, value)
		},
	}
}

function stub_getter_storage(get_item: (key: string) => string | null): void {
	vi.stubGlobal('localStorage', {
		getItem: get_item,
		setItem: (): void => {
			/* no-op */
		},
	})
}

interface KeysetValues {
	score: string
	round: string
	check: string
}

function stub_keyed_storage(keys: StorageKeys, values: KeysetValues): void {
	stub_getter_storage((key: string) => {
		if (key === keys.score) return values.score
		if (key === keys.round) return values.round
		if (key === keys.check) return values.check

		return null
	})
}

function seed_legacy_keys(storage: Storage, values: KeysetValues): void {
	storage.setItem(LEGACY_SCORE_KEY, values.score)
	storage.setItem(LEGACY_ROUND_KEY, values.round)
	storage.setItem(LEGACY_CHECK_KEY, values.check)
}

function expect_new_keyset(storage: Storage, values: KeysetValues): void {
	expect(storage.getItem(NEW_SCORE_KEY)).toBe(values.score)
	expect(storage.getItem(NEW_ROUND_KEY)).toBe(values.round)
	expect(storage.getItem(NEW_CHECK_KEY)).toBe(values.check)
}

function expect_legacy_keyset_absent(storage: Storage): void {
	expect(storage.getItem(LEGACY_SCORE_KEY)).toBeNull()
	expect(storage.getItem(LEGACY_ROUND_KEY)).toBeNull()
	expect(storage.getItem(LEGACY_CHECK_KEY)).toBeNull()
}

function describe_calculate_time_coefficient(): void {
	describe('calculate_time_coefficient', () => {
		it('returns 1.0 for zero elapsed time', () => {
			expect(score.calculate_time_coefficient(ELAPSED_0, SEQ_1)).toBe(1)
		})

		it('decays by 0.1 per avg second per button', () => {
			const avg_s = ELAPSED_5S / 1000 / SEQ_5
			const expected = 1 - avg_s * 0.1

			expect(score.calculate_time_coefficient(ELAPSED_5S, SEQ_5)).toBeCloseTo(expected, 5)
		})

		it('returns MIN_TIME_COEFF (0.1) when avg seconds is very large', () => {
			expect(score.calculate_time_coefficient(ELAPSED_100S, SEQ_1)).toBeCloseTo(0.1)
		})

		it('normalizes by sequence length so longer rounds are not unfairly penalized', () => {
			const coeff_short = score.calculate_time_coefficient(ELAPSED_5S, SEQ_1)
			const coeff_long = score.calculate_time_coefficient(ELAPSED_5S * SEQ_5, SEQ_5)

			expect(coeff_short).toBeCloseTo(coeff_long, 5)
		})
	})
}

function describe_calculate_round_score(): void {
	describe('calculate_round_score', () => {
		it('returns BASE_SCORE * round for zero elapsed time', () => {
			expect(score.calculate_round_score(ELAPSED_0, SEQ_1, ROUND_1)).toBe(1000)
			expect(score.calculate_round_score(ELAPSED_0, SEQ_5, ROUND_5)).toBe(5000)
		})

		it('scales with round number', () => {
			const r1 = score.calculate_round_score(ELAPSED_0, ROUND_1, ROUND_1)
			const r5 = score.calculate_round_score(ELAPSED_0, ROUND_5, ROUND_5)

			expect(r5).toBe(r1 * ROUND_5)
		})

		it('produces a lower score for slower responses', () => {
			const fast = score.calculate_round_score(ELAPSED_0, SEQ_1, ROUND_1)
			const slow = score.calculate_round_score(ELAPSED_10S, SEQ_1, ROUND_1)

			expect(slow).toBeLessThan(fast)
		})

		it('floors at 10% of BASE_SCORE * round for very slow responses', () => {
			const floor_score = score.calculate_round_score(ELAPSED_100S, SEQ_1, ROUND_5)

			expect(floor_score).toBe(500)
		})
	})
}

function describe_format_score(): void {
	describe('format_score', () => {
		it('formats numbers below 1000 without comma', () => {
			expect(score.format_score(999)).toBe('999')
		})

		it('formats numbers at 1000 with comma', () => {
			expect(score.format_score(1000)).toBe('1,000')
		})

		it('formats large numbers with multiple commas', () => {
			expect(score.format_score(1_234_567)).toBe('1,234,567')
		})

		it('formats zero', () => {
			expect(score.format_score(0)).toBe('0')
		})
	})
}

function describe_add_round_score(): void {
	describe('add_round_score', () => {
		it('accumulates current_score after each round', () => {
			score.add_round_score(ELAPSED_0, SEQ_1, ROUND_1)
			expect(score.current_score).toBe(1000)
			score.add_round_score(ELAPSED_0, SEQ_1, ROUND_1)
			expect(score.current_score).toBe(2000)
		})

		it('updates high_score when current_score exceeds it', () => {
			const previous_high = score.high_score

			score.add_round_score(ELAPSED_0, SEQ_1, previous_high + 2)
			expect(score.high_score).toBeGreaterThan(previous_high)
			expect(score.high_score).toBe(score.current_score)
		})

		it('does not update high_score when current_score stays below it', () => {
			const previous_high = score.high_score

			score.add_round_score(ELAPSED_0, SEQ_1, previous_high + 2)
			const established = score.high_score

			score.reset()
			score.add_round_score(ELAPSED_100S, SEQ_1, ROUND_1)
			expect(score.high_score).toBe(established)
		})

		it('sets is_new_high_score to true when current_score exceeds high_score', () => {
			expect(score.is_new_high_score).toBe(false)
			const previous_high = score.high_score

			score.add_round_score(ELAPSED_0, SEQ_1, previous_high + 2)
			expect(score.is_new_high_score).toBe(true)
		})
	})
}

function describe_reset(): void {
	describe('reset', () => {
		it('resets current_score to 0', () => {
			score.add_round_score(ELAPSED_0, SEQ_1, ROUND_1)
			score.reset()
			expect(score.current_score).toBe(0)
		})

		it('resets is_new_high_score to false', () => {
			const previous_high = score.high_score

			score.add_round_score(ELAPSED_0, SEQ_1, previous_high + 2)
			expect(score.is_new_high_score).toBe(true)
			score.reset()
			expect(score.is_new_high_score).toBe(false)
		})

		it('preserves high_score across reset', () => {
			const previous_high = score.high_score

			score.add_round_score(ELAPSED_0, SEQ_1, previous_high + 2)
			const new_high = score.high_score

			score.reset()
			expect(score.high_score).toBe(new_high)
		})
	})
}

function describe_last_cleared_round(): void {
	describe('last_cleared_round', () => {
		it('starts at 0', () => {
			expect(score.last_cleared_round).toBe(0)
		})

		it('is set to the round passed to add_round_score', () => {
			score.add_round_score(ELAPSED_0, SEQ_1, ROUND_5)
			expect(score.last_cleared_round).toBe(ROUND_5)
		})

		it('is reset to 0 by reset()', () => {
			score.add_round_score(ELAPSED_0, SEQ_1, ROUND_5)
			score.reset()
			expect(score.last_cleared_round).toBe(0)
		})
	})
}

function describe_high_score_round(): void {
	describe('high_score_round', () => {
		it('is updated to the round when a new high score is set', () => {
			const previous_high = score.high_score

			score.add_round_score(ELAPSED_0, SEQ_1, previous_high + 2)
			expect(score.high_score_round).toBe(previous_high + 2)
		})

		it('is preserved across reset', () => {
			const previous_high = score.high_score

			score.add_round_score(ELAPSED_0, SEQ_1, previous_high + 2)
			const expected_round = previous_high + 2

			score.reset()
			expect(score.high_score_round).toBe(expected_round)
		})

		it('is not updated when current score stays below high score', () => {
			const previous_high = score.high_score

			score.add_round_score(ELAPSED_0, SEQ_1, previous_high + 5)
			const saved_round = score.high_score_round

			score.reset()
			score.add_round_score(ELAPSED_100S, SEQ_1, ROUND_1)
			expect(score.high_score_round).toBe(saved_round)
		})
	})
}

describe('score', () => {
	beforeEach(() => {
		score.reset()
	})

	describe_calculate_time_coefficient()
	describe_calculate_round_score()
	describe_format_score()
	describe_add_round_score()
	describe_reset()
	describe_last_cleared_round()
	describe_high_score_round()
})

describe('compute_check', () => {
	it('returns a non-zero value for (0, 0)', () => {
		expect(compute_check(0, 0)).not.toBe(0)
	})

	it('is deterministic — same inputs produce same output', () => {
		expect(compute_check(1000, 3)).toBe(compute_check(1000, 3))
	})

	it('produces different values when score differs', () => {
		expect(compute_check(1000, 3)).not.toBe(compute_check(2000, 3))
	})

	it('produces different values when round differs', () => {
		expect(compute_check(1000, 3)).not.toBe(compute_check(1000, 4))
	})
})

describe('load_stored_data', () => {
	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it('returns {score: 0, round: 0} when nothing is stored', () => {
		stub_getter_storage(() => null)
		expect(load_stored_data(DEFAULT_KEYS)).toEqual({ score: 0, round: 0 })
	})

	it('returns correct values when data is valid', () => {
		const stored_score = 5000
		const stored_round = 3
		const stored_check = compute_check(stored_score, stored_round)

		stub_keyed_storage(DEFAULT_KEYS, {
			score: String(stored_score),
			round: String(stored_round),
			check: String(stored_check),
		})
		expect(load_stored_data(DEFAULT_KEYS)).toEqual({ score: stored_score, round: stored_round })
	})

	it('returns {score: 0, round: 0} when check digit does not match (tampered)', () => {
		stub_keyed_storage(DEFAULT_KEYS, { score: '5000', round: '3', check: '99999' })
		expect(load_stored_data(DEFAULT_KEYS)).toEqual({ score: 0, round: 0 })
	})

	it('returns {score: 0, round: 0} when localStorage throws', () => {
		vi.stubGlobal('localStorage', {
			getItem: (): never => {
				throw new Error('unavailable')
			},
		})
		expect(load_stored_data(DEFAULT_KEYS)).toEqual({ score: 0, round: 0 })
	})

	it('uses keys from the provided StorageKeys object', () => {
		const custom_keys: StorageKeys = { score: 'test_s', round: 'test_r', check: 'test_c' }
		const stored_score = 1000
		const stored_round = 1
		const stored_check = compute_check(stored_score, stored_round)

		stub_keyed_storage(custom_keys, {
			score: String(stored_score),
			round: String(stored_round),
			check: String(stored_check),
		})
		expect(load_stored_data(custom_keys)).toEqual({ score: stored_score, round: stored_round })
	})
})

describe('create_score isolation', () => {
	it('two instances do not share current_score state', () => {
		const first = create_score()
		const second = create_score()

		first.add_round_score(ELAPSED_0, SEQ_1, ROUND_1)
		expect(first.current_score).toBeGreaterThan(0)
		expect(second.current_score).toBe(0)
	})

	it('custom key prefix stores to different keys than default', () => {
		const custom = create_score('test')

		stub_getter_storage(() => null)
		expect(custom.high_score).toBe(0)
		vi.unstubAllGlobals()
	})
})

function describe_migrate_move_and_skip(): void {
	it('moves legacy simon_* keys to the new mnemecha_* keys and removes the legacy entries', () => {
		const storage = make_memory_storage()

		seed_legacy_keys(storage, { score: '5000', round: '3', check: '12345' })
		vi.stubGlobal('localStorage', storage)

		migrate_legacy_score_keys('simon', 'mnemecha')

		expect_new_keyset(storage, { score: '5000', round: '3', check: '12345' })
		expect_legacy_keyset_absent(storage)
	})

	it('does nothing when no legacy keys are present', () => {
		const storage = make_memory_storage()

		vi.stubGlobal('localStorage', storage)

		migrate_legacy_score_keys('simon', 'mnemecha')

		expect(storage.getItem(NEW_SCORE_KEY)).toBeNull()
		expect(storage).toHaveLength(0)
	})

	it('keeps existing new-key values and discards legacy when both prefixes have data', () => {
		const storage = make_memory_storage()

		storage.setItem(NEW_SCORE_KEY, '9999')
		storage.setItem(NEW_ROUND_KEY, '7')
		storage.setItem(NEW_CHECK_KEY, '54321')
		seed_legacy_keys(storage, { score: '1000', round: '1', check: '11111' })
		vi.stubGlobal('localStorage', storage)

		migrate_legacy_score_keys('simon', 'mnemecha')

		expect_new_keyset(storage, { score: '9999', round: '7', check: '54321' })
		expect_legacy_keyset_absent(storage)
	})
}

function describe_migrate_edge_cases(): void {
	it('is a no-op when legacy_prefix equals new_prefix', () => {
		const storage = make_memory_storage()

		storage.setItem(NEW_SCORE_KEY, '2000')
		vi.stubGlobal('localStorage', storage)

		migrate_legacy_score_keys('mnemecha', 'mnemecha')

		expect(storage.getItem(NEW_SCORE_KEY)).toBe('2000')
	})

	it('fills missing new keys from a complete legacy keyset and removes legacy', () => {
		const storage = make_memory_storage()

		storage.setItem(NEW_SCORE_KEY, '500')
		seed_legacy_keys(storage, { score: '5000', round: '3', check: '12345' })
		vi.stubGlobal('localStorage', storage)

		migrate_legacy_score_keys('simon', 'mnemecha')

		expect_new_keyset(storage, { score: '5000', round: '3', check: '12345' })
		expect_legacy_keyset_absent(storage)
	})

	it('preserves legacy keys when neither new nor legacy keyset is complete', () => {
		const storage = make_memory_storage()

		storage.setItem(NEW_SCORE_KEY, '500')
		storage.setItem(LEGACY_SCORE_KEY, '5000')
		vi.stubGlobal('localStorage', storage)

		migrate_legacy_score_keys('simon', 'mnemecha')

		expect(storage.getItem(LEGACY_SCORE_KEY)).toBe('5000')
	})

	it('does not throw when localStorage access throws', () => {
		vi.stubGlobal('localStorage', {
			getItem: (): never => {
				throw new Error('unavailable')
			},
			setItem: (): void => {
				/* no-op */
			},
			removeItem: (): void => {
				/* no-op */
			},
		})

		expect(() => {
			migrate_legacy_score_keys('simon', 'mnemecha')
		}).not.toThrow()
	})
}

describe('migrate_legacy_score_keys', () => {
	afterEach(() => {
		vi.unstubAllGlobals()
	})

	describe_migrate_move_and_skip()
	describe_migrate_edge_cases()
})
