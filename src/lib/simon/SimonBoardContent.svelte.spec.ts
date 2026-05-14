import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'
import SimonBoardContent from './SimonBoardContent.svelte'
import type { ButtonColor } from './types'

vi.mock('@threlte/core', () => ({ T: {}, useTask: vi.fn() }))
vi.mock('@threlte/extras', () => ({ Text: function Text() {} }))

function lit_none(): boolean {
	return false
}

const BASE_PROPS = {
	is_alt: false,
	flash_intensity: 1,
	center_text: 'START',
	is_color_lit: lit_none,
	on_button_pointer_down: vi.fn(),
	on_button_release: vi.fn(),
	on_center_click: vi.fn(),
}

describe('SimonBoardContent', () => {
	it('renders without error with default callbacks', () => {
		const { container } = render(SimonBoardContent, { props: BASE_PROPS })
		expect(container).toBeTruthy()
	})

	it('renders without error when a color is lit', () => {
		const { container } = render(SimonBoardContent, {
			props: { ...BASE_PROPS, is_color_lit: (c: ButtonColor) => c === 'green' },
		})
		expect(container).toBeTruthy()
	})

	it('renders without error in cyber/alt mode', () => {
		const { container } = render(SimonBoardContent, {
			props: { ...BASE_PROPS, is_alt: true, flash_intensity: 2.5 },
		})
		expect(container).toBeTruthy()
	})

	it('renders without error with an empty center text', () => {
		const { container } = render(SimonBoardContent, {
			props: { ...BASE_PROPS, center_text: '' },
		})
		expect(container).toBeTruthy()
	})
})
