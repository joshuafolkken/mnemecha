import { session } from '@joshuafolkken/game-kit'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { simon_board_input } from './board-input'
import type { ButtonColor } from './types'

const LEFT_BUTTON = 0
const RIGHT_BUTTON = 2

const mocks: {
	press: ReturnType<typeof vi.fn<(color: ButtonColor) => void>>
	release: ReturnType<typeof vi.fn<() => void>>
	start: ReturnType<typeof vi.fn<() => void>>
} = {
	press: vi.fn<(color: ButtonColor) => void>(),
	release: vi.fn<() => void>(),
	start: vi.fn<() => void>(),
}

function reset_board(): void {
	session.reset_session()
	mocks.press = vi.fn<(color: ButtonColor) => void>()
	mocks.release = vi.fn<() => void>()
	mocks.start = vi.fn<() => void>()
	simon_board_input.configure({
		on_press: mocks.press,
		on_release: mocks.release,
		on_start: mocks.start,
	})
}

function register_pointer_down_tests(): void {
	it('does not call on_press when session is not started', () => {
		simon_board_input.on_button_pointer_down({ nativeEvent: { button: LEFT_BUTTON } }, 'green')
		expect(mocks.press).not.toHaveBeenCalled()
	})

	it('calls on_press once session has started', () => {
		session.start_session()
		simon_board_input.on_button_pointer_down({ nativeEvent: { button: LEFT_BUTTON } }, 'red')
		expect(mocks.press).toHaveBeenCalledWith('red')
	})

	it('does not call on_press for non-left click even after session started', () => {
		session.start_session()
		simon_board_input.on_button_pointer_down({ nativeEvent: { button: RIGHT_BUTTON } }, 'blue')
		expect(mocks.press).not.toHaveBeenCalled()
	})
}

function register_release_tests(): void {
	it('does not call on_release when session is not started', () => {
		simon_board_input.on_button_release()
		expect(mocks.release).not.toHaveBeenCalled()
	})

	it('calls on_release once session has started', () => {
		session.start_session()
		simon_board_input.on_button_release()
		expect(mocks.release).toHaveBeenCalledTimes(1)
	})
}

function register_center_click_tests(): void {
	it('does not call on_start when session is not started', () => {
		simon_board_input.on_center_click()
		expect(mocks.start).not.toHaveBeenCalled()
	})

	it('calls on_start once session has started', () => {
		session.start_session()
		simon_board_input.on_center_click()
		expect(mocks.start).toHaveBeenCalledTimes(1)
	})
}

describe('simon_board_input', () => {
	beforeEach(reset_board)

	describe('on_button_pointer_down', register_pointer_down_tests)
	describe('on_button_release', register_release_tests)
	describe('on_center_click', register_center_click_tests)
})
