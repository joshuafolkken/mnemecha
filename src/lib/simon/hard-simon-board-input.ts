import { pointer_button } from '$lib/game/pointer-button'
import { session } from '$lib/game/session.svelte'
import { HARD_BOARD_CENTER_INDEX } from './hard-board-config'
import type { ButtonColor, HardBoardIndex, HardSequenceItem } from './types'

type HardBoardCallbacks = {
	on_press: (item: HardSequenceItem) => void
	on_release: () => void
	on_start: () => void
}

let board_callbacks: HardBoardCallbacks = {
	on_press: () => {},
	on_release: () => {},
	on_start: () => {},
}

function configure(cbs: HardBoardCallbacks): void {
	board_callbacks = cbs
}

function on_button_pointer_down(
	e: { nativeEvent: { button: number } },
	board_index: HardBoardIndex,
	color: ButtonColor,
): void {
	if (!session.is_session_started) return
	if (!pointer_button.is_left_click(e)) return
	board_callbacks.on_press({ board_index, color })
}

function on_button_release(): void {
	if (!session.is_session_started) return
	board_callbacks.on_release()
}

function on_center_click(board_index: HardBoardIndex): void {
	if (!session.is_session_started) return
	if (board_index !== HARD_BOARD_CENTER_INDEX) return
	board_callbacks.on_start()
}

export const hard_simon_board_input = {
	configure,
	on_button_pointer_down,
	on_button_release,
	on_center_click,
}
