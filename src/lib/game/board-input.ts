import { pointer_button, session } from '@joshuafolkken/game-kit'
import type { ButtonColor } from './types'

interface BoardCallbacks {
	on_press: (color: ButtonColor) => void
	on_release: () => void
	on_start: () => void
}

const board_state: { callbacks: BoardCallbacks } = {
	callbacks: {
		on_press: () => {
			/* no-op */
		},
		on_release: () => {
			/* no-op */
		},
		on_start: () => {
			/* no-op */
		},
	},
}

function configure(cbs: BoardCallbacks): void {
	board_state.callbacks = cbs
}

function on_button_pointer_down(e: { nativeEvent: { button: number } }, color: ButtonColor): void {
	if (!session.is_session_started) return
	if (!pointer_button.is_left_click(e)) return
	board_state.callbacks.on_press(color)
}

function on_button_release(): void {
	if (!session.is_session_started) return
	board_state.callbacks.on_release()
}

function on_center_click(): void {
	if (!session.is_session_started) return
	board_state.callbacks.on_start()
}

export const simon_board_input = {
	configure,
	on_button_pointer_down,
	on_button_release,
	on_center_click,
}
