import { game_state } from '$lib/game/state.svelte'
import { simon_audio } from './audio'
import { HARD_SCORE_KEY_PREFIX } from './hard-board-config'
import { create_score, type ScoreInstance } from './score.svelte'
import { create_engine, type EngineApi } from './simon-engine.svelte'
import type { ButtonColor, HardBoardIndex, HardSequenceItem, SimonPhase } from './types'

const ALL_COLORS: readonly ButtonColor[] = ['green', 'red', 'yellow', 'blue']
const BOARD_INDICES: readonly HardBoardIndex[] = [0, 1, 2]
const FALLBACK_ITEM: HardSequenceItem = { board_index: 0, color: 'green' }

function build_pool(): readonly HardSequenceItem[] {
	const items: HardSequenceItem[] = []
	for (const board_index of BOARD_INDICES) {
		for (const color of ALL_COLORS) items.push({ board_index, color })
	}
	return items
}

export const HARD_BUTTON_POOL: readonly HardSequenceItem[] = build_pool()

export interface HardSimonApi {
	readonly phase: SimonPhase
	readonly sequence: readonly HardSequenceItem[]
	readonly position: number
	readonly active_item: HardSequenceItem | null
	readonly pressed_item: HardSequenceItem | null
	readonly round: number
	readonly flash_colors: readonly ButtonColor[]
	readonly flash_intensity: number
	start: () => void
	press: (item: HardSequenceItem) => void
	release: () => void
	reset: () => void
}

function make_hard_simon_config(score: ScoreInstance) {
	return {
		pool: HARD_BUTTON_POOL,
		fallback: FALLBACK_ITEM,
		equals: (a: HardSequenceItem, b: HardSequenceItem): boolean =>
			a.board_index === b.board_index && a.color === b.color,
		start_press_tone: (item: HardSequenceItem): void =>
			simon_audio.start_tone(item.color, game_state.is_alt),
		play_show_tone: (item: HardSequenceItem, duration_ms: number): void =>
			simon_audio.play_tone(item.color, duration_ms, game_state.is_alt),
		play_error_tone: (duration_ms: number): void =>
			simon_audio.play_error_tone(duration_ms, game_state.is_alt),
		stop_tone: (): void => simon_audio.stop_tone(),
		victory_flash_colors: ALL_COLORS,
		add_score: (elapsed_ms: number, sequence_length: number, round: number): void =>
			score.add_round_score(elapsed_ms, sequence_length, round),
		reset_score: (): void => score.reset(),
	}
}

function make_hard_simon_api(engine: EngineApi<HardSequenceItem>): HardSimonApi {
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
		get active_item() {
			return engine.active_item
		},
		get pressed_item() {
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

export function create_hard_simon(score: ScoreInstance): HardSimonApi {
	const engine = create_engine<HardSequenceItem>(make_hard_simon_config(score))
	return make_hard_simon_api(engine)
}

export type HardSimonInstance = HardSimonApi

export const hard_score = create_score(HARD_SCORE_KEY_PREFIX)
export const hard_simon = create_hard_simon(hard_score)
