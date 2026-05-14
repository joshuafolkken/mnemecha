import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'
import HardSimonBoard from './HardSimonBoard.svelte'
import type { HardBoardIndex, HardSimonBoardData } from './types'

vi.mock('@threlte/core', () => ({ T: {}, useTask: vi.fn() }))
vi.mock('@threlte/extras', () => ({ Text: function Text() {} }))

const CENTER_INDEX: HardBoardIndex = 1
const LEFT_INDEX: HardBoardIndex = 0
const RIGHT_INDEX: HardBoardIndex = 2

function make_simon_data(overrides: Partial<HardSimonBoardData> = {}): HardSimonBoardData {
	return {
		active_item: null,
		pressed_item: null,
		phase: 'idle',
		round: 0,
		flash_colors: [],
		flash_intensity: 1,
		...overrides,
	}
}

const BOARD_TEXT_PROPS = {
	is_alt: false,
	text_gameover: 'GAME OVER',
	text_round: 'ROUND',
	text_start: 'START',
}

describe('HardSimonBoard', () => {
	it('renders the center board without error in idle state', () => {
		const { container } = render(HardSimonBoard, {
			props: {
				board_index: CENTER_INDEX,
				simon_data: make_simon_data(),
				...BOARD_TEXT_PROPS,
			},
		})
		expect(container).toBeTruthy()
	})

	it('renders the left board without error in idle state', () => {
		const { container } = render(HardSimonBoard, {
			props: {
				board_index: LEFT_INDEX,
				simon_data: make_simon_data(),
				...BOARD_TEXT_PROPS,
			},
		})
		expect(container).toBeTruthy()
	})

	it('renders the right board without error in idle state', () => {
		const { container } = render(HardSimonBoard, {
			props: {
				board_index: RIGHT_INDEX,
				simon_data: make_simon_data(),
				...BOARD_TEXT_PROPS,
			},
		})
		expect(container).toBeTruthy()
	})

	it('renders when a (board_index, color) tuple is active', () => {
		const { container } = render(HardSimonBoard, {
			props: {
				board_index: CENTER_INDEX,
				simon_data: make_simon_data({
					active_item: { board_index: CENTER_INDEX, color: 'green' },
				}),
				...BOARD_TEXT_PROPS,
			},
		})
		expect(container).toBeTruthy()
	})

	it('renders without error in gameover phase', () => {
		const { container } = render(HardSimonBoard, {
			props: {
				board_index: CENTER_INDEX,
				simon_data: make_simon_data({ phase: 'gameover' }),
				...BOARD_TEXT_PROPS,
			},
		})
		expect(container).toBeTruthy()
	})

	it('renders without error during round_complete with flash colors', () => {
		const { container } = render(HardSimonBoard, {
			props: {
				board_index: LEFT_INDEX,
				simon_data: make_simon_data({
					phase: 'round_complete',
					flash_colors: ['green', 'red', 'yellow', 'blue'],
					flash_intensity: 2.5,
				}),
				...BOARD_TEXT_PROPS,
			},
		})
		expect(container).toBeTruthy()
	})

	it('renders without error when round is in progress', () => {
		const { container } = render(HardSimonBoard, {
			props: {
				board_index: CENTER_INDEX,
				simon_data: make_simon_data({ phase: 'showing', round: 5 }),
				...BOARD_TEXT_PROPS,
			},
		})
		expect(container).toBeTruthy()
	})
})
