import type { ScoreData } from '@joshuafolkken/game-kit'
import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'
import HardSimonScene from './HardScene.svelte'
import type { HardSimonBoardData } from './types'

vi.mock('@threlte/core', () => ({ T: {}, useTask: vi.fn() }))
vi.mock('@threlte/extras', () => ({
	// eslint-disable-next-line @typescript-eslint/naming-convention -- mocks external component export 'Text'
	Text: function Text() {
		/* no-op */
	},
}))
vi.mock('./HardBoard.svelte', () => ({
	// eslint-disable-next-line @typescript-eslint/naming-convention -- mocks external component export 'HardSimonBoard'
	default: function HardSimonBoard() {
		/* no-op */
	},
}))
vi.mock('@joshuafolkken/game-kit', () => ({
	// eslint-disable-next-line @typescript-eslint/naming-convention -- mocks external component export 'ScoreDisplay'
	ScoreDisplay: function ScoreDisplay() {
		/* no-op */
	},
}))
vi.mock('./hard-board-config', () => ({
	HARD_BOARD_X_LEFT: -1.95,
	HARD_BOARD_X_CENTER: 0,
	HARD_BOARD_X_RIGHT: 1.95,
	HARD_BOARD_Y: 1.2,
	HARD_BOARD_Z: 4.8,
	HARD_SCORE_DISPLAY_Z: 4.4,
}))

function make_simon_data(): HardSimonBoardData {
	return {
		active_item: null,
		pressed_item: null,
		phase: 'idle',
		round: 0,
		flash_colors: [],
		flash_intensity: 1,
	}
}

function make_score_data(): ScoreData {
	return {
		high_score: 0,
		current_score: 0,
		is_new_high_score: false,
		high_score_round: 0,
		last_cleared_round: 0,
		format_score: String,
	}
}

const SCENE_PROPS = {
	is_alt: false,
	text_gameover: 'GAME OVER',
	text_start: 'START',
	label_high_score: 'HI',
	label_round: 'RND',
	label_current: 'SCORE',
}

describe('HardSimonScene', () => {
	it('renders without error in idle state', () => {
		const { container } = render(HardSimonScene, {
			props: {
				simon_data: make_simon_data(),
				score_data: make_score_data(),
				...SCENE_PROPS,
			},
		})

		expect(container).toBeTruthy()
	})

	it('renders without error when score is non-zero', () => {
		const score_data = { ...make_score_data(), current_score: 1000, high_score: 5000 }
		const { container } = render(HardSimonScene, {
			props: {
				simon_data: make_simon_data(),
				score_data,
				...SCENE_PROPS,
			},
		})

		expect(container).toBeTruthy()
	})
})
