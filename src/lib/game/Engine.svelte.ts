import { cancel_flash, run_victory_flash, type FlashState, type FlashTimers } from './flash'
import type { ButtonColor, SimonPhase } from './types'

export const STEP_MS_1_5 = 500
export const STEP_MS_6_13 = 400
export const STEP_MS_14_20 = 250
export const STEP_MS_21_PLUS = 150
export const ON_RATIO = 0.7
export const OFF_RATIO = 0.3
export const ERROR_BEEP_MS = 3000
export const RESTART_DELAY_MS = 1000

export type EngineState<T> = {
	phase: SimonPhase
	sequence: Array<T>
	position: number
	active_item: T | null
	pressed_item: T | null
	round: number
} & FlashState

export type EngineTimers = {
	show_gen: number
	restart_timer: ReturnType<typeof setTimeout> | null
	input_start_ms: number
} & FlashTimers

export interface EngineConfig<T> {
	pool: ReadonlyArray<T>
	fallback: T
	equals: (a: T, b: T) => boolean
	start_press_tone: (item: T) => void
	play_show_tone: (item: T, duration_ms: number) => void
	play_error_tone: (duration_ms: number) => void
	stop_tone: () => void
	victory_flash_colors: ReadonlyArray<ButtonColor>
	add_score: (elapsed_ms: number, sequence_length: number, round: number) => void
	reset_score: () => void
}

async function delay(ms: number): Promise<void> {
	await new Promise((resolve) => setTimeout(resolve, ms))
}

const STEP_THRESHOLD_1_5 = 5
const STEP_THRESHOLD_6_13 = 13
const STEP_THRESHOLD_14_20 = 20

function get_step_ms(length_: number): number {
	if (length_ <= STEP_THRESHOLD_1_5) return STEP_MS_1_5
	if (length_ <= STEP_THRESHOLD_6_13) return STEP_MS_6_13
	if (length_ <= STEP_THRESHOLD_14_20) return STEP_MS_14_20

	return STEP_MS_21_PLUS
}

function pick_random<T>(pool: ReadonlyArray<T>, fallback: T): T {
	// eslint-disable-next-line sonarjs/pseudo-random -- non-cryptographic game randomness
	const index = Math.floor(Math.random() * pool.length)

	return pool[index] ?? fallback
}

function add_to_sequence<T>(state: EngineState<T>, config: EngineConfig<T>): void {
	state.sequence.push(pick_random(config.pool, config.fallback))
}

function cancel_restart_timer(t: EngineTimers): void {
	if (t.restart_timer !== null) clearTimeout(t.restart_timer)
	t.restart_timer = null
}

async function run_show<T>(
	state: EngineState<T>,
	t: EngineTimers,
	config: EngineConfig<T>,
	gen: number,
): Promise<void> {
	const step_ms = get_step_ms(state.sequence.length)
	const on_ms = step_ms * ON_RATIO
	const off_ms = step_ms * OFF_RATIO

	for (const item of state.sequence) {
		if (gen !== t.show_gen) return
		state.active_item = item
		config.play_show_tone(item, on_ms)
		await delay(on_ms)
		if (gen !== t.show_gen) return
		state.active_item = null
		await delay(off_ms)
	}

	if (gen !== t.show_gen) return
	t.input_start_ms = Date.now()
	state.phase = 'player_input'
	state.position = 0
}

function start_next_round<T>(
	state: EngineState<T>,
	t: EngineTimers,
	config: EngineConfig<T>,
): void {
	t.restart_timer = null
	cancel_flash(state, t)
	state.round += 1
	add_to_sequence(state, config)
	t.show_gen += 1
	void run_show(state, t, config, t.show_gen)
}

function schedule_next_round<T>(
	state: EngineState<T>,
	t: EngineTimers,
	config: EngineConfig<T>,
): void {
	cancel_restart_timer(t)
	cancel_flash(state, t)
	state.phase = 'showing'
	void run_victory_flash(state, t, config.victory_flash_colors, t.flash_gen)
	t.restart_timer = setTimeout(() => {
		start_next_round(state, t, config)
	}, RESTART_DELAY_MS)
}

function handle_correct_release<T>(
	state: EngineState<T>,
	t: EngineTimers,
	config: EngineConfig<T>,
): void {
	state.position += 1
	if (state.position < state.sequence.length) return
	config.add_score(Date.now() - t.input_start_ms, state.sequence.length, state.round)
	state.phase = 'round_complete'
	schedule_next_round(state, t, config)
}

function start_engine<T>(state: EngineState<T>, t: EngineTimers, config: EngineConfig<T>): void {
	if (state.phase === 'showing' || state.phase === 'player_input') return
	cancel_restart_timer(t)
	config.stop_tone()
	config.reset_score()
	state.phase = 'showing'
	state.round = 1
	state.sequence = []
	add_to_sequence(state, config)
	t.show_gen += 1
	void run_show(state, t, config, t.show_gen)
}

function expected_item<T>(state: EngineState<T>, config: EngineConfig<T>): T {
	return state.sequence[state.position] ?? config.fallback
}

function release_engine<T>(state: EngineState<T>, t: EngineTimers, config: EngineConfig<T>): void {
	if (state.phase !== 'player_input') return
	const item = state.pressed_item
	if (item === null) return
	config.stop_tone()
	state.pressed_item = null

	if (config.equals(item, expected_item(state, config))) {
		handle_correct_release(state, t, config)
	} else {
		config.play_error_tone(ERROR_BEEP_MS)
		state.phase = 'gameover'
	}
}

function press_engine<T>(state: EngineState<T>, config: EngineConfig<T>, item: T): void {
	if (state.phase !== 'player_input') return
	if (state.pressed_item !== null) return
	state.pressed_item = item
	config.start_press_tone(item)
}

function reset_engine<T>(state: EngineState<T>, t: EngineTimers, config: EngineConfig<T>): void {
	t.show_gen += 1
	config.stop_tone()
	state.pressed_item = null
	cancel_restart_timer(t)
	cancel_flash(state, t)
	config.reset_score()
	state.phase = 'idle'
	state.sequence = []
	state.position = 0
	state.active_item = null
	t.input_start_ms = 0
	state.round = 0
}

export interface EngineApi<T> {
	readonly phase: SimonPhase
	readonly sequence: ReadonlyArray<T>
	readonly position: number
	readonly active_item: T | null
	readonly pressed_item: T | null
	readonly round: number
	readonly flash_colors: ReadonlyArray<ButtonColor>
	readonly flash_intensity: number
	start: () => void
	press: (item: T) => void
	release: () => void
	reset: () => void
}

function make_engine_api<T>(
	state: EngineState<T>,
	t: EngineTimers,
	config: EngineConfig<T>,
): EngineApi<T> {
	return {
		get phase() {
			return state.phase
		},
		get sequence() {
			return state.sequence
		},
		get position() {
			return state.position
		},
		get active_item() {
			return state.active_item
		},
		get pressed_item() {
			return state.pressed_item
		},
		get round() {
			return state.round
		},
		get flash_colors() {
			return state.flash_colors
		},
		get flash_intensity() {
			return state.flash_intensity
		},
		start: (): void => {
			start_engine(state, t, config)
		},
		press: (item: T): void => {
			press_engine(state, config, item)
		},
		release: (): void => {
			release_engine(state, t, config)
		},
		reset: (): void => {
			reset_engine(state, t, config)
		},
	}
}

function create_engine<T>(config: EngineConfig<T>): EngineApi<T> {
	const state = $state<EngineState<T>>({
		phase: 'idle',
		sequence: [],
		position: 0,
		active_item: null,
		pressed_item: null,
		round: 0,
		flash_colors: [],
		flash_intensity: 1,
	})
	const t: EngineTimers = { show_gen: 0, flash_gen: 0, restart_timer: null, input_start_ms: 0 }

	return make_engine_api(state, t, config)
}

export { create_engine }
