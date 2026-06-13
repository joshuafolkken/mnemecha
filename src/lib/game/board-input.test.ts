import { session } from '@joshuafolkken/game-kit'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { simon_board_input } from './board-input'
import type { ButtonColor } from './types'

const LEFT_BUTTON = 0
const RIGHT_BUTTON = 2

let press_mock: ReturnType<typeof vi.fn<(color: ButtonColor) => void>> =
	vi.fn<(color: ButtonColor) => void>()
let release_mock: ReturnType<typeof vi.fn<() => void>> = vi.fn<() => void>()
let start_mock: ReturnType<typeof vi.fn<() => void>> = vi.fn<() => void>()

function reset_board(): void {
	session.reset_session()
	press_mock = vi.fn<(color: ButtonColor) => void>()
	release_mock = vi.fn<() => void>()
	start_mock = vi.fn<() => void>()
	simon_board_input.configure({
		on_press: press_mock,
		on_release: release_mock,
		on_start: start_mock,
	})
}

function register_pointer_down_tests(): void {
	it('does not call on_press when session is not started', () => {
		simon_board_input.on_button_pointer_down({ nativeEvent: { button: LEFT_BUTTON } }, 'green')
		expect(press_mock).not.toHaveBeenCalled()
	})

	it('calls on_press once session has started', () => {
		session.start_session()
		simon_board_input.on_button_pointer_down({ nativeEvent: { button: LEFT_BUTTON } }, 'red')
		expect(press_mock).toHaveBeenCalledWith('red')
	})

	it('does not call on_press for non-left click even after session started', () => {
		session.start_session()
		simon_board_input.on_button_pointer_down({ nativeEvent: { button: RIGHT_BUTTON } }, 'blue')
		expect(press_mock).not.toHaveBeenCalled()
	})
}

function register_release_tests(): void {
	it('does not call on_release when session is not started', () => {
		simon_board_input.on_button_release()
		expect(release_mock).not.toHaveBeenCalled()
	})

	it('calls on_release once session has started', () => {
		session.start_session()
		simon_board_input.on_button_release()
		expect(release_mock).toHaveBeenCalledTimes(1)
	})
}

function register_center_click_tests(): void {
	it('does not call on_start when session is not started', () => {
		simon_board_input.on_center_click()
		expect(start_mock).not.toHaveBeenCalled()
	})

	it('calls on_start once session has started', () => {
		session.start_session()
		simon_board_input.on_center_click()
		expect(start_mock).toHaveBeenCalledTimes(1)
	})
}

describe('simon_board_input', () => {
	beforeEach(reset_board)

	describe('on_button_pointer_down', register_pointer_down_tests)
	describe('on_button_release', register_release_tests)
	describe('on_center_click', register_center_click_tests)
})
