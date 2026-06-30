import { session } from '@joshuafolkken/game-kit'
import { hard_simon_board_input } from '$lib/game/hard-board-input'
import type { HardBoardIndex, HardSequenceItem } from '$lib/game/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const LEFT_BUTTON = 0
const RIGHT_BUTTON = 2
const CENTER_INDEX: HardBoardIndex = 1
const LEFT_INDEX: HardBoardIndex = 0
const RIGHT_INDEX: HardBoardIndex = 2

const mocks: {
	press: ReturnType<typeof vi.fn<(item: HardSequenceItem) => void>>
	release: ReturnType<typeof vi.fn<() => void>>
	start: ReturnType<typeof vi.fn<() => void>>
} = {
	press: vi.fn<(item: HardSequenceItem) => void>(),
	release: vi.fn<() => void>(),
	start: vi.fn<() => void>(),
}

function reset_board(): void {
	session.reset_session()
	mocks.press = vi.fn<(item: HardSequenceItem) => void>()
	mocks.release = vi.fn<() => void>()
	mocks.start = vi.fn<() => void>()
	hard_simon_board_input.configure({
		on_press: mocks.press,
		on_release: mocks.release,
		on_start: mocks.start,
	})
}

function register_pointer_down_tests(): void {
	it('does not call on_press when session is not started', () => {
		hard_simon_board_input.on_button_pointer_down(
			{ nativeEvent: { button: LEFT_BUTTON } },
			LEFT_INDEX,
			'green',
		)
		expect(mocks.press).not.toHaveBeenCalled()
	})

	it('calls on_press with (board_index, color) once session has started', () => {
		session.start_session()
		hard_simon_board_input.on_button_pointer_down(
			{ nativeEvent: { button: LEFT_BUTTON } },
			RIGHT_INDEX,
			'red',
		)
		expect(mocks.press).toHaveBeenCalledWith({ board_index: RIGHT_INDEX, color: 'red' })
	})

	it('does not call on_press for non-left click even after session started', () => {
		session.start_session()
		hard_simon_board_input.on_button_pointer_down(
			{ nativeEvent: { button: RIGHT_BUTTON } },
			CENTER_INDEX,
			'blue',
		)
		expect(mocks.press).not.toHaveBeenCalled()
	})
}

function register_release_tests(): void {
	it('does not call on_release when session is not started', () => {
		hard_simon_board_input.on_button_release()
		expect(mocks.release).not.toHaveBeenCalled()
	})

	it('calls on_release once session has started', () => {
		session.start_session()
		hard_simon_board_input.on_button_release()
		expect(mocks.release).toHaveBeenCalledTimes(1)
	})
}

function register_center_click_tests(): void {
	it('does not call on_start when session is not started', () => {
		hard_simon_board_input.on_center_click(CENTER_INDEX)
		expect(mocks.start).not.toHaveBeenCalled()
	})

	it('calls on_start for the center board once session has started', () => {
		session.start_session()
		hard_simon_board_input.on_center_click(CENTER_INDEX)
		expect(mocks.start).toHaveBeenCalledTimes(1)
	})

	it('does not call on_start for the left board even after session started', () => {
		session.start_session()
		hard_simon_board_input.on_center_click(LEFT_INDEX)
		expect(mocks.start).not.toHaveBeenCalled()
	})

	it('does not call on_start for the right board even after session started', () => {
		session.start_session()
		hard_simon_board_input.on_center_click(RIGHT_INDEX)
		expect(mocks.start).not.toHaveBeenCalled()
	})
}

describe('hard_simon_board_input', () => {
	beforeEach(reset_board)

	describe('on_button_pointer_down', register_pointer_down_tests)
	describe('on_button_release', register_release_tests)
	describe('on_center_click', register_center_click_tests)
})
