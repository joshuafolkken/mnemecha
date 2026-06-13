import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'
import HardSimonBoard from './HardBoard.svelte'
import type { HardBoardIndex, HardSimonBoardData } from './types'

vi.mock('@threlte/core', () => ({ T: {}, useTask: vi.fn() }))
vi.mock('@threlte/extras', () => ({
	// eslint-disable-next-line @typescript-eslint/naming-convention -- mocks external component export 'Text'
	Text: function Text() {
		/* no-op */
	},
}))

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
	text_start: 'START',
}

function expect_renders(
	board_index: HardBoardIndex,
	overrides: Partial<HardSimonBoardData> = {},
): void {
	const { container } = render(HardSimonBoard, {
		props: {
			board_index,
			simon_data: make_simon_data(overrides),
			...BOARD_TEXT_PROPS,
		},
	})

	expect(container).toBeTruthy()
}

describe('HardSimonBoard', () => {
	it('renders the center board without error in idle state', () => {
		expect_renders(CENTER_INDEX)
	})

	it('renders the left board without error in idle state', () => {
		expect_renders(LEFT_INDEX)
	})

	it('renders the right board without error in idle state', () => {
		expect_renders(RIGHT_INDEX)
	})

	it('renders when a (board_index, color) tuple is active', () => {
		expect_renders(CENTER_INDEX, {
			active_item: { board_index: CENTER_INDEX, color: 'green' },
		})
	})

	it('renders without error in gameover phase', () => {
		expect_renders(CENTER_INDEX, { phase: 'gameover' })
	})

	it('renders without error during round_complete with flash colors', () => {
		expect_renders(LEFT_INDEX, {
			phase: 'round_complete',
			flash_colors: ['green', 'red', 'yellow', 'blue'],
			flash_intensity: 2.5,
		})
	})

	it('renders without error when round is in progress', () => {
		expect_renders(CENTER_INDEX, { phase: 'showing', round: 5 })
	})
})
