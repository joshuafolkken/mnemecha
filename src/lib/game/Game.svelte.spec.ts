import { simon_audio } from '$lib/game/audio'
import {
	FLASH_BURST_CYCLES,
	FLASH_BURST_OFF_MS,
	FLASH_BURST_ON_MS,
	FLASH_CASCADE_FWD_MS,
	FLASH_CASCADE_REV_MS,
	FLASH_FINALE_MS,
} from '$lib/game/flash'
import {
	create_simon,
	ERROR_BEEP_MS,
	OFF_RATIO,
	ON_RATIO,
	RESTART_DELAY_MS,
	simon,
	STEP_MS_1_5,
} from '$lib/game/Game.svelte'
import { create_score, score } from '$lib/game/Score.svelte'
import type { ButtonColor } from '$lib/game/types'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const ALL_COLORS: Array<ButtonColor> = ['green', 'red', 'yellow', 'blue']
const TONE_MS = 200
const ON_MS = STEP_MS_1_5 * ON_RATIO
const OFF_MS = STEP_MS_1_5 * OFF_RATIO

function wrong_color(color: ButtonColor): ButtonColor {
	return ALL_COLORS.find((candidate) => candidate !== color) ?? 'red'
}

function seq_at(index: number): ButtonColor {
	const color = simon.sequence[index]
	if (!color) throw new Error(`sequence index ${String(index)} out of range`)

	return color
}

function use_simon_lifecycle(): void {
	beforeEach(() => {
		vi.useFakeTimers()
		simon.reset()
	})

	afterEach(() => {
		vi.clearAllTimers()
		vi.useRealTimers()
		vi.restoreAllMocks()
		simon.reset()
	})
}

async function start_and_show(): Promise<void> {
	simon.start()
	await vi.runAllTimersAsync()
}

async function clear_round_one(): Promise<void> {
	await start_and_show()
	simon.press(seq_at(0))
	simon.release()
}

describe('simon FSM: lifecycle', () => {
	use_simon_lifecycle()

	it('starts in idle phase with empty sequence and round 0', () => {
		expect(simon.phase).toBe('idle')
		expect(simon.sequence).toHaveLength(0)
		expect(simon.round).toBe(0)
		expect(simon.active_color).toBeNull()
		expect(simon.pressed_color).toBeNull()
	})

	it('start() transitions to showing, sets round 1, adds one sequence item', () => {
		simon.start()
		expect(simon.phase).toBe('showing')
		expect(simon.round).toBe(1)
		expect(simon.sequence).toHaveLength(1)
	})

	it('start() sets active_color to first sequence item immediately', () => {
		simon.start()
		expect(simon.active_color).toBe(seq_at(0))
	})

	it('showing phase transitions to player_input after timers complete', async () => {
		await start_and_show()
		expect(simon.phase).toBe('player_input')
		expect(simon.position).toBe(0)
		expect(simon.active_color).toBeNull()
	})

	it('active_color clears after on_ms and phase becomes player_input after off_ms', async () => {
		simon.start()
		expect(simon.active_color).toBe(seq_at(0))
		await vi.advanceTimersByTimeAsync(ON_MS)
		expect(simon.active_color).toBeNull()
		await vi.advanceTimersByTimeAsync(OFF_MS)
		expect(simon.phase).toBe('player_input')
	})
})

describe('simon FSM: start guards', () => {
	use_simon_lifecycle()

	it('start() is ignored while showing', () => {
		simon.start()
		simon.start()
		expect(simon.round).toBe(1)
	})

	it('start() is ignored during player_input', async () => {
		await start_and_show()
		simon.start()
		expect(simon.phase).toBe('player_input')
	})

	it('start() from gameover restarts the game', async () => {
		await start_and_show()
		simon.press(wrong_color(seq_at(0)))
		simon.release()
		expect(simon.phase).toBe('gameover')
		simon.start()
		expect(simon.phase).toBe('showing')
		expect(simon.round).toBe(1)
	})
})

describe('simon FSM: rounds', () => {
	use_simon_lifecycle()

	it('final correct press + release advances to showing for the next round', async () => {
		await clear_round_one()
		expect(simon.phase).toBe('showing')
		expect(simon.round).toBe(1)
	})

	it('round does not advance while last button is still held', async () => {
		await start_and_show()
		const final_color = seq_at(0)

		simon.press(final_color)
		await vi.advanceTimersByTimeAsync(RESTART_DELAY_MS * 2)
		expect(simon.phase).toBe('player_input')
		expect(simon.round).toBe(1)
		expect(simon.pressed_color).toBe(final_color)
	})

	it('next round starts after 1 second delay following release of final button', async () => {
		await clear_round_one()
		expect(simon.phase).toBe('showing')
		await vi.advanceTimersByTimeAsync(RESTART_DELAY_MS)
		expect(simon.round).toBe(2)
		expect(simon.sequence).toHaveLength(2)
	})

	it('correct intermediate press + release advances position without completing round', async () => {
		await clear_round_one()
		await vi.runAllTimersAsync() // drain round 2 show
		const first_color = seq_at(0)

		simon.press(first_color) // first of two correct presses
		simon.release()
		expect(simon.position).toBe(1)
		expect(simon.phase).toBe('player_input')
		expect(simon.round).toBe(2)
	})

	it('wrong press + release triggers gameover', async () => {
		await start_and_show()
		simon.press(wrong_color(seq_at(0)))
		simon.release()
		expect(simon.phase).toBe('gameover')
	})

	it('release while phase is showing does not schedule an extra next-round timer', async () => {
		await start_and_show()
		simon.press(seq_at(0)) // holding the final button (phase still player_input)
		simon.release() // completes round 1 → phase becomes showing
		simon.release() // should be ignored while showing
		await vi.advanceTimersByTimeAsync(RESTART_DELAY_MS)
		expect(simon.round).toBe(2)
		await vi.advanceTimersByTimeAsync(RESTART_DELAY_MS)
		expect(simon.round).toBe(2)
	})
})

describe('simon FSM: reset', () => {
	use_simon_lifecycle()

	it('reset() while a button is held returns to idle', async () => {
		await start_and_show()
		simon.press(seq_at(0))
		simon.reset()
		await vi.advanceTimersByTimeAsync(RESTART_DELAY_MS)
		expect(simon.phase).toBe('idle')
		expect(simon.round).toBe(0)
	})

	it('reset() cancels restart timer so next round does not start', async () => {
		await clear_round_one()
		simon.reset()
		await vi.advanceTimersByTimeAsync(RESTART_DELAY_MS)
		expect(simon.phase).toBe('idle')
		expect(simon.round).toBe(0)
	})

	it('reset() returns all state to initial values', async () => {
		await start_and_show()
		simon.reset()
		expect(simon.phase).toBe('idle')
		expect(simon.sequence).toHaveLength(0)
		expect(simon.position).toBe(0)
		expect(simon.active_color).toBeNull()
		expect(simon.pressed_color).toBeNull()
		expect(simon.round).toBe(0)
	})

	it('reset() clears pressed_color immediately', async () => {
		await start_and_show()
		const wrong = wrong_color(seq_at(0))

		simon.press(wrong)
		expect(simon.pressed_color).toBe(wrong)
		simon.reset()
		expect(simon.pressed_color).toBeNull()
	})

	it('reset() cancels an in-progress sequence display', async () => {
		simon.start()
		simon.reset()
		await vi.runAllTimersAsync()
		expect(simon.phase).toBe('idle')
	})
})

describe('simon FSM: input and tones', () => {
	use_simon_lifecycle()

	it('press is ignored while another button is being held', async () => {
		await start_and_show()
		simon.press(seq_at(0))
		const spy = vi.spyOn(simon_audio, 'start_tone')

		simon.press('green')
		simon.press('red')
		expect(spy).not.toHaveBeenCalled()
		expect(simon.phase).toBe('player_input')
	})

	it('press() is ignored when not in player_input phase', () => {
		simon.start() // phase = showing
		simon.press('green')
		expect(simon.phase).toBe('showing')
	})

	it('pressed_color is set on press and does not auto-clear', async () => {
		await start_and_show()
		const color = seq_at(0)

		simon.press(color)
		expect(simon.pressed_color).toBe(color)
		await vi.advanceTimersByTimeAsync(TONE_MS + 10)
		expect(simon.pressed_color).toBe(color)
	})

	it('release() clears pressed_color', async () => {
		await clear_round_one()
		expect(simon.pressed_color).toBeNull()
	})
})

describe('simon FSM: tone playback', () => {
	use_simon_lifecycle()

	it('wrong press + release plays error tone for ERROR_BEEP_MS', async () => {
		const spy = vi.spyOn(simon_audio, 'play_error_tone')

		await start_and_show()
		simon.press(wrong_color(seq_at(0)))
		simon.release()
		expect(spy).toHaveBeenCalledWith(ERROR_BEEP_MS, false)
	})

	it('press() starts tone for pressed color', async () => {
		const spy = vi.spyOn(simon_audio, 'start_tone')

		await start_and_show()
		const color = seq_at(0)

		simon.press(color)
		expect(spy).toHaveBeenCalledWith(color, false)
	})

	it('press() does not start tone when not in player_input phase', () => {
		simon.start() // phase = showing
		const spy = vi.spyOn(simon_audio, 'start_tone')

		simon.press('green')
		expect(spy).not.toHaveBeenCalled()
	})

	it('release() stops the tone', async () => {
		const spy = vi.spyOn(simon_audio, 'stop_tone')

		await clear_round_one()
		expect(spy).toHaveBeenCalled()
	})

	it('start() stops any lingering tone before kicking off a new sequence', () => {
		const spy = vi.spyOn(simon_audio, 'stop_tone')

		simon.start()
		expect(spy).toHaveBeenCalled()
	})
})

describe('score integration', () => {
	use_simon_lifecycle()

	it('current_score is 0 while the final button is held and increases after release', async () => {
		await start_and_show()
		simon.press(seq_at(0))
		expect(score.current_score).toBe(0)
		simon.release()
		expect(score.current_score).toBeGreaterThan(0)
	})

	it('current_score is 1000 when round 1 is cleared with ~0 elapsed time', async () => {
		await clear_round_one()
		expect(score.current_score).toBe(1000)
	})

	it('current_score resets to 0 after simon.reset()', async () => {
		await clear_round_one()
		expect(score.current_score).toBeGreaterThan(0)
		simon.reset()
		expect(score.current_score).toBe(0)
	})

	it('current_score resets to 0 when a new game starts via simon.start()', async () => {
		await clear_round_one()
		expect(score.current_score).toBeGreaterThan(0)
		await vi.runAllTimersAsync()
		simon.press(wrong_color(seq_at(0)))
		simon.release()
		expect(simon.phase).toBe('gameover')
		simon.start()
		expect(score.current_score).toBe(0)
	})
})

describe('victory flash', () => {
	use_simon_lifecycle()

	it('flash_colors is empty before any round completes', () => {
		simon.start()
		expect(simon.flash_colors).toHaveLength(0)
	})

	it('flash_colors contains all 4 colors immediately after release on round_complete', async () => {
		await clear_round_one()
		expect(simon.flash_colors).toHaveLength(4)
		expect(simon.flash_colors).toEqual(expect.arrayContaining(ALL_COLORS))
	})

	it('flash_intensity is greater than 1 immediately after release on round_complete', async () => {
		await clear_round_one()
		expect(simon.flash_intensity).toBeGreaterThan(1)
	})

	it('play_tone is called for all colors during burst stage', async () => {
		const spy = vi.spyOn(simon_audio, 'play_tone')

		await start_and_show()
		spy.mockClear()
		simon.press(seq_at(0))
		simon.release()
		const called_colors = spy.mock.calls.map((call) => call[0])

		expect(called_colors).toEqual(expect.arrayContaining(ALL_COLORS))
	})
})

describe('victory flash: clearing', () => {
	use_simon_lifecycle()

	it('flash_colors and flash_intensity reset after full flash duration', async () => {
		const flash_total_ms =
			FLASH_BURST_CYCLES * (FLASH_BURST_ON_MS + FLASH_BURST_OFF_MS) +
			ALL_COLORS.length * (FLASH_CASCADE_FWD_MS + FLASH_CASCADE_REV_MS) +
			FLASH_FINALE_MS

		await clear_round_one()
		await vi.advanceTimersByTimeAsync(flash_total_ms + 10)
		expect(simon.flash_colors).toHaveLength(0)
		expect(simon.flash_intensity).toBe(1)
	})

	it('reset() clears flash_colors and flash_intensity immediately', async () => {
		await clear_round_one()
		expect(simon.flash_colors).toHaveLength(4)
		simon.reset()
		expect(simon.flash_colors).toHaveLength(0)
		expect(simon.flash_intensity).toBe(1)
	})

	it('flash_colors and flash_intensity cleared when next round starts', async () => {
		await clear_round_one()
		expect(simon.flash_colors).toHaveLength(4)
		await vi.advanceTimersByTimeAsync(RESTART_DELAY_MS)
		expect(simon.flash_colors).toHaveLength(0)
		expect(simon.flash_intensity).toBe(1)
	})
})

describe('create_simon isolation', () => {
	beforeEach(() => {
		vi.useFakeTimers()
	})

	afterEach(() => {
		vi.clearAllTimers()
		vi.useRealTimers()
		vi.restoreAllMocks()
	})

	it('two instances do not share phase state', () => {
		const first = create_simon(create_score())
		const second = create_simon(create_score())

		first.start()
		expect(first.phase).toBe('showing')
		expect(second.phase).toBe('idle')
		first.reset()
	})

	it('two instances do not share sequence state', () => {
		const first = create_simon(create_score())
		const second = create_simon(create_score())

		first.start()
		expect(first.sequence).toHaveLength(1)
		expect(second.sequence).toHaveLength(0)
		first.reset()
	})

	it('create_simon with custom colors only uses those colors in sequence', () => {
		const custom_colors: Array<ButtonColor> = ['green', 'blue']
		const instance = create_simon(create_score(), { colors: custom_colors })

		instance.start()

		for (let index = 0; index < 20; index++) {
			instance.reset()
			instance.start()
		}

		const used = new Set(instance.sequence)
		for (const color of used) expect(custom_colors).toContain(color)
		instance.reset()
	})
})
