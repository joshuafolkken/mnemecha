import { game_state } from '$lib/game/state.svelte'
import { simon_audio } from './audio'
import { score as default_score, type ScoreInstance } from './score.svelte'
import {
	create_engine,
	ERROR_BEEP_MS,
	OFF_RATIO,
	ON_RATIO,
	RESTART_DELAY_MS,
	STEP_MS_1_5,
	STEP_MS_6_13,
	STEP_MS_14_20,
	STEP_MS_21_PLUS,
	type EngineApi,
} from './simon-engine.svelte'
import type { ButtonColor, SimonPhase } from './types'

export {
	ERROR_BEEP_MS,
	OFF_RATIO,
	ON_RATIO,
	RESTART_DELAY_MS,
	STEP_MS_14_20,
	STEP_MS_1_5,
	STEP_MS_21_PLUS,
	STEP_MS_6_13,
}

const DEFAULT_COLORS: readonly ButtonColor[] = ['green', 'red', 'yellow', 'blue']
const FALLBACK_COLOR: ButtonColor = 'green'

export interface SimonApi {
	readonly phase: SimonPhase
	readonly sequence: readonly ButtonColor[]
	readonly position: number
	readonly active_color: ButtonColor | null
	readonly pressed_color: ButtonColor | null
	readonly round: number
	readonly flash_colors: readonly ButtonColor[]
	readonly flash_intensity: number
	start: () => void
	press: (color: ButtonColor) => void
	release: () => void
	reset: () => void
}

function make_simon_config(score: ScoreInstance, colors: readonly ButtonColor[]) {
	return {
		pool: colors,
		fallback: FALLBACK_COLOR,
		equals: (a: ButtonColor, b: ButtonColor): boolean => a === b,
		start_press_tone: (color: ButtonColor): void =>
			simon_audio.start_tone(color, game_state.is_alt),
		play_show_tone: (color: ButtonColor, duration_ms: number): void =>
			simon_audio.play_tone(color, duration_ms, game_state.is_alt),
		play_error_tone: (duration_ms: number): void =>
			simon_audio.play_error_tone(duration_ms, game_state.is_alt),
		stop_tone: (): void => simon_audio.stop_tone(),
		victory_flash_colors: colors,
		add_score: (elapsed_ms: number, sequence_length: number, round: number): void =>
			score.add_round_score(elapsed_ms, sequence_length, round),
		reset_score: (): void => score.reset(),
	}
}

function make_simon_api(engine: EngineApi<ButtonColor>): SimonApi {
	return {
		get phase() {
			return engine.phase
		},
		get sequence() {
			return engine.sequence
		},
		get position() {
			return engine.position
		},
		get active_color() {
			return engine.active_item
		},
		get pressed_color() {
			return engine.pressed_item
		},
		get round() {
			return engine.round
		},
		get flash_colors() {
			return engine.flash_colors
		},
		get flash_intensity() {
			return engine.flash_intensity
		},
		start: engine.start,
		press: engine.press,
		release: engine.release,
		reset: engine.reset,
	}
}

type SimonConfig = { colors?: readonly ButtonColor[] }

export function create_simon(score: ScoreInstance, config: SimonConfig = {}): SimonApi {
	const colors = config.colors ?? DEFAULT_COLORS
	const engine = create_engine<ButtonColor>(make_simon_config(score, colors))
	return make_simon_api(engine)
}

export type SimonInstance = SimonApi

export const simon = create_simon(default_score)
