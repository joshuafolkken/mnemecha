import { simon_audio } from '$lib/game/audio'
import { ERROR_BEEP_MS, RESTART_DELAY_MS } from '$lib/game/engine.svelte'
import { create_hard_simon, HARD_BUTTON_POOL, hard_score, hard_simon } from '$lib/game/hard.svelte'
import { create_score } from '$lib/game/score.svelte'
import type { ButtonColor, HardSequenceItem } from '$lib/game/types'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const ALL_COLORS: ButtonColor[] = ['green', 'red', 'yellow', 'blue']
const EXPECTED_POOL_SIZE = 12
const BOARD_COUNT = 3
const REPEAT_LOOKUP_TRIES = 200

function seq_at(i: number): HardSequenceItem {
	const item = hard_simon.sequence[i]
	if (!item) throw new Error(`hard sequence index ${String(i)} out of range`)
	return item
}

function wrong_item(item: HardSequenceItem): HardSequenceItem {
	const other_color = ALL_COLORS.find((c) => c !== item.color) ?? 'red'
	return { board_index: item.board_index, color: other_color }
}

describe('hard simon FSM', () => {
	beforeEach(() => {
		vi.useFakeTimers()
		hard_simon.reset()
	})

	afterEach(() => {
		vi.clearAllTimers()
		vi.useRealTimers()
		vi.restoreAllMocks()
		hard_simon.reset()
	})

	it('starts in idle phase with empty sequence and round 0', () => {
		expect(hard_simon.phase).toBe('idle')
		expect(hard_simon.sequence).toHaveLength(0)
		expect(hard_simon.round).toBe(0)
		expect(hard_simon.active_item).toBeNull()
		expect(hard_simon.pressed_item).toBeNull()
	})

	it('start() transitions to showing, sets round 1, adds one sequence item', () => {
		hard_simon.start()
		expect(hard_simon.phase).toBe('showing')
		expect(hard_simon.round).toBe(1)
		expect(hard_simon.sequence).toHaveLength(1)
	})

	it('showing phase transitions to player_input after timers complete', async () => {
		hard_simon.start()
		await vi.runAllTimersAsync()
		expect(hard_simon.phase).toBe('player_input')
	})

	it('correct press + release advances to next round after delay', async () => {
		hard_simon.start()
		await vi.runAllTimersAsync()
		hard_simon.press(seq_at(0))
		hard_simon.release()
		expect(hard_simon.phase).toBe('showing')
		await vi.advanceTimersByTimeAsync(RESTART_DELAY_MS)
		expect(hard_simon.round).toBe(2)
		expect(hard_simon.sequence).toHaveLength(2)
	})

	it('wrong-color press + release triggers gameover', async () => {
		hard_simon.start()
		await vi.runAllTimersAsync()
		hard_simon.press(wrong_item(seq_at(0)))
		hard_simon.release()
		expect(hard_simon.phase).toBe('gameover')
	})

	it('wrong-board press + release triggers gameover even with correct color', async () => {
		hard_simon.start()
		await vi.runAllTimersAsync()
		const target = seq_at(0)
		const wrong_board = ((target.board_index + 1) % BOARD_COUNT) as HardSequenceItem['board_index']
		hard_simon.press({ board_index: wrong_board, color: target.color })
		hard_simon.release()
		expect(hard_simon.phase).toBe('gameover')
	})

	it('wrong press plays error tone', async () => {
		const spy = vi.spyOn(simon_audio, 'play_error_tone')
		hard_simon.start()
		await vi.runAllTimersAsync()
		hard_simon.press(wrong_item(seq_at(0)))
		hard_simon.release()
		expect(spy).toHaveBeenCalledWith(ERROR_BEEP_MS, false)
	})

	it('press() starts tone for pressed color', async () => {
		const spy = vi.spyOn(simon_audio, 'start_tone')
		hard_simon.start()
		await vi.runAllTimersAsync()
		const target = seq_at(0)
		hard_simon.press(target)
		expect(spy).toHaveBeenCalledWith(target.color, false)
	})

	it('reset() returns to idle state', async () => {
		hard_simon.start()
		await vi.runAllTimersAsync()
		hard_simon.reset()
		expect(hard_simon.phase).toBe('idle')
		expect(hard_simon.sequence).toHaveLength(0)
		expect(hard_simon.round).toBe(0)
	})
})

describe('hard simon pool', () => {
	it('exposes exactly 12 items (3 boards x 4 colors)', () => {
		expect(HARD_BUTTON_POOL).toHaveLength(EXPECTED_POOL_SIZE)
	})

	it('pool includes every board x color combination', () => {
		const seen = new Set<string>()
		for (const item of HARD_BUTTON_POOL) seen.add(`${String(item.board_index)}:${item.color}`)
		expect(seen.size).toBe(EXPECTED_POOL_SIZE)
		for (let b = 0; b < BOARD_COUNT; b++) {
			for (const c of ALL_COLORS) expect(seen.has(`${String(b)}:${c}`)).toBe(true)
		}
	})

	it('all 12 buttons can appear in sequences over enough draws', () => {
		vi.useFakeTimers()
		const score_a = create_score('hard_pool_test')
		const sim = create_hard_simon(score_a)
		const seen = new Set<string>()
		for (let i = 0; i < REPEAT_LOOKUP_TRIES; i++) {
			sim.reset()
			sim.start()
			const item = sim.sequence[0]
			if (item) seen.add(`${String(item.board_index)}:${item.color}`)
		}
		sim.reset()
		vi.useRealTimers()
		expect(seen.size).toBe(EXPECTED_POOL_SIZE)
	})
})

describe('hard simon score isolation', () => {
	beforeEach(() => {
		vi.useFakeTimers()
		hard_simon.reset()
	})

	afterEach(() => {
		vi.clearAllTimers()
		vi.useRealTimers()
		vi.restoreAllMocks()
		hard_simon.reset()
	})

	it('hard_score is a distinct instance from any other score', () => {
		const other = create_score('different_prefix')
		expect(hard_score).not.toBe(other)
	})

	it('clearing round 1 increases hard_score current_score', async () => {
		hard_score.reset()
		hard_simon.start()
		await vi.runAllTimersAsync()
		hard_simon.press(seq_at(0))
		hard_simon.release()
		expect(hard_score.current_score).toBeGreaterThan(0)
	})

	it('hard_simon.reset() also resets hard_score current_score', async () => {
		hard_simon.start()
		await vi.runAllTimersAsync()
		hard_simon.press(seq_at(0))
		hard_simon.release()
		expect(hard_score.current_score).toBeGreaterThan(0)
		hard_simon.reset()
		expect(hard_score.current_score).toBe(0)
	})
})

describe('create_hard_simon isolation', () => {
	beforeEach(() => {
		vi.useFakeTimers()
	})

	afterEach(() => {
		vi.clearAllTimers()
		vi.useRealTimers()
		vi.restoreAllMocks()
	})

	it('two instances do not share phase state', () => {
		const score_a = create_score('hard_iso_a')
		const score_b = create_score('hard_iso_b')
		const a = create_hard_simon(score_a)
		const b = create_hard_simon(score_b)
		a.start()
		expect(a.phase).toBe('showing')
		expect(b.phase).toBe('idle')
		a.reset()
	})
})
