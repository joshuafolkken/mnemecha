import { cancel_flash, run_victory_flash, type FlashState, type FlashTimers } from './simon-flash'
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
	sequence: T[]
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
	pool: readonly T[]
	fallback: T
	equals: (a: T, b: T) => boolean
	start_press_tone: (item: T) => void
	play_show_tone: (item: T, duration_ms: number) => void
	play_error_tone: (duration_ms: number) => void
	stop_tone: () => void
	victory_flash_colors: readonly ButtonColor[]
	add_score: (elapsed_ms: number, sequence_length: number, round: number) => void
	reset_score: () => void
}

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

function get_step_ms(len: number): number {
	if (len <= 5) return STEP_MS_1_5
	if (len <= 13) return STEP_MS_6_13
	if (len <= 20) return STEP_MS_14_20
	return STEP_MS_21_PLUS
}

function pick_random<T>(pool: readonly T[], fallback: T): T {
	const index = Math.floor(Math.random() * pool.length) // NOSONAR — game RNG, not security-sensitive
	return pool[index] ?? fallback
}

function add_to_sequence<T>(s: EngineState<T>, cfg: EngineConfig<T>): void {
	s.sequence.push(pick_random(cfg.pool, cfg.fallback))
}

function cancel_restart_timer(t: EngineTimers): void {
	if (t.restart_timer !== null) clearTimeout(t.restart_timer)
	t.restart_timer = null
}

async function run_show<T>(
	s: EngineState<T>,
	t: EngineTimers,
	cfg: EngineConfig<T>,
	gen: number,
): Promise<void> {
	const step_ms = get_step_ms(s.sequence.length)
	const on_ms = step_ms * ON_RATIO
	const off_ms = step_ms * OFF_RATIO
	for (const item of s.sequence) {
		if (gen !== t.show_gen) return
		s.active_item = item
		cfg.play_show_tone(item, on_ms)
		await delay(on_ms)
		if (gen !== t.show_gen) return
		s.active_item = null
		await delay(off_ms)
	}
	if (gen !== t.show_gen) return
	t.input_start_ms = Date.now()
	s.phase = 'player_input'
	s.position = 0
}

function start_next_round<T>(s: EngineState<T>, t: EngineTimers, cfg: EngineConfig<T>): void {
	t.restart_timer = null
	cancel_flash(s, t)
	s.round += 1
	add_to_sequence(s, cfg)
	t.show_gen += 1
	void run_show(s, t, cfg, t.show_gen)
}

function schedule_next_round<T>(s: EngineState<T>, t: EngineTimers, cfg: EngineConfig<T>): void {
	cancel_restart_timer(t)
	cancel_flash(s, t)
	s.phase = 'showing'
	void run_victory_flash(s, t, cfg.victory_flash_colors, t.flash_gen)
	t.restart_timer = setTimeout(() => start_next_round(s, t, cfg), RESTART_DELAY_MS)
}

function handle_correct_release<T>(s: EngineState<T>, t: EngineTimers, cfg: EngineConfig<T>): void {
	s.position += 1
	if (s.position < s.sequence.length) return
	cfg.add_score(Date.now() - t.input_start_ms, s.sequence.length, s.round)
	s.phase = 'round_complete'
	schedule_next_round(s, t, cfg)
}

function start_engine<T>(s: EngineState<T>, t: EngineTimers, cfg: EngineConfig<T>): void {
	if (s.phase === 'showing' || s.phase === 'player_input') return
	cancel_restart_timer(t)
	cfg.stop_tone()
	cfg.reset_score()
	s.phase = 'showing'
	s.round = 1
	s.sequence = []
	add_to_sequence(s, cfg)
	t.show_gen += 1
	void run_show(s, t, cfg, t.show_gen)
}

function expected_item<T>(s: EngineState<T>, cfg: EngineConfig<T>): T {
	return s.sequence[s.position] ?? cfg.fallback
}

function release_engine<T>(s: EngineState<T>, t: EngineTimers, cfg: EngineConfig<T>): void {
	if (s.phase !== 'player_input') return
	const item = s.pressed_item
	if (item === null) return
	cfg.stop_tone()
	s.pressed_item = null
	if (cfg.equals(item, expected_item(s, cfg))) {
		handle_correct_release(s, t, cfg)
	} else {
		cfg.play_error_tone(ERROR_BEEP_MS)
		s.phase = 'gameover'
	}
}

function press_engine<T>(s: EngineState<T>, cfg: EngineConfig<T>, item: T): void {
	if (s.phase !== 'player_input') return
	if (s.pressed_item !== null) return
	s.pressed_item = item
	cfg.start_press_tone(item)
}

function reset_engine<T>(s: EngineState<T>, t: EngineTimers, cfg: EngineConfig<T>): void {
	t.show_gen += 1
	cfg.stop_tone()
	s.pressed_item = null
	cancel_restart_timer(t)
	cancel_flash(s, t)
	cfg.reset_score()
	s.phase = 'idle'
	s.sequence = []
	s.position = 0
	s.active_item = null
	t.input_start_ms = 0
	s.round = 0
}

export interface EngineApi<T> {
	readonly phase: SimonPhase
	readonly sequence: readonly T[]
	readonly position: number
	readonly active_item: T | null
	readonly pressed_item: T | null
	readonly round: number
	readonly flash_colors: readonly ButtonColor[]
	readonly flash_intensity: number
	start: () => void
	press: (item: T) => void
	release: () => void
	reset: () => void
}

function make_engine_api<T>(
	s: EngineState<T>,
	t: EngineTimers,
	cfg: EngineConfig<T>,
): EngineApi<T> {
	return {
		get phase() {
			return s.phase
		},
		get sequence() {
			return s.sequence
		},
		get position() {
			return s.position
		},
		get active_item() {
			return s.active_item
		},
		get pressed_item() {
			return s.pressed_item
		},
		get round() {
			return s.round
		},
		get flash_colors() {
			return s.flash_colors
		},
		get flash_intensity() {
			return s.flash_intensity
		},
		start: (): void => start_engine(s, t, cfg),
		press: (item: T): void => press_engine(s, cfg, item),
		release: (): void => release_engine(s, t, cfg),
		reset: (): void => reset_engine(s, t, cfg),
	}
}

export function create_engine<T>(cfg: EngineConfig<T>): EngineApi<T> {
	const s = $state<EngineState<T>>({
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
	return make_engine_api(s, t, cfg)
}
