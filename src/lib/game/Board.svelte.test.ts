import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'
import SimonBoard from './Board.svelte'
import type { SimonBoardData } from './types'

vi.mock('@threlte/core', () => ({ T: {}, useTask: vi.fn() }))
vi.mock('@threlte/extras', () => ({
	// eslint-disable-next-line @typescript-eslint/naming-convention -- mocks external component export 'Text'
	Text: function Text() {
		/* no-op */
	},
}))

function make_simon_data(overrides: Partial<SimonBoardData> = {}): SimonBoardData {
	return {
		active_color: null,
		pressed_color: null,
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

describe('SimonBoard', () => {
	it('renders without error in idle state', async () => {
		const { container } = await render(SimonBoard, {
			props: { simon_data: make_simon_data(), ...BOARD_TEXT_PROPS },
		})

		expect(container).toBeTruthy()
	})

	it('renders without error when a color is active', async () => {
		const { container } = await render(SimonBoard, {
			props: { simon_data: make_simon_data({ active_color: 'green' }), ...BOARD_TEXT_PROPS },
		})

		expect(container).toBeTruthy()
	})

	it('renders without error in gameover phase', async () => {
		const { container } = await render(SimonBoard, {
			props: { simon_data: make_simon_data({ phase: 'gameover' }), ...BOARD_TEXT_PROPS },
		})

		expect(container).toBeTruthy()
	})

	it('renders without error when round is in progress', async () => {
		const { container } = await render(SimonBoard, {
			props: { simon_data: make_simon_data({ phase: 'showing', round: 3 }), ...BOARD_TEXT_PROPS },
		})

		expect(container).toBeTruthy()
	})

	it('renders without error with flash colors', async () => {
		const { container } = await render(SimonBoard, {
			props: {
				simon_data: make_simon_data({ flash_colors: ['red', 'blue'] }),
				...BOARD_TEXT_PROPS,
			},
		})

		expect(container).toBeTruthy()
	})
})
