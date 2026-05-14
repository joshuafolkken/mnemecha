<script lang="ts">
	import { T } from '@threlte/core'
	import { BOARD_Y, BOARD_Z } from './board-config'
	import { simon_board_input } from './simon-board-input'
	import SimonBoardContent from './SimonBoardContent.svelte'
	import type { ButtonColor, SimonBoardData } from './types'

	interface Props {
		simon_data: SimonBoardData
		is_alt: boolean
		text_gameover: string
		text_round: string
		text_start: string
	}

	let { simon_data, is_alt, text_gameover, text_round, text_start }: Props = $props()

	function is_color_lit(color: ButtonColor): boolean {
		return (
			simon_data.active_color === color ||
			simon_data.pressed_color === color ||
			simon_data.flash_colors.includes(color)
		)
	}

	function get_center_text(): string {
		if (simon_data.phase === 'gameover') return text_gameover
		if (simon_data.round > 0) return `${text_round} ${simon_data.round}`
		return text_start
	}

	let center_text = $derived(get_center_text())
</script>

<T.Group position={[0, BOARD_Y, BOARD_Z]}>
	<SimonBoardContent
		{is_alt}
		flash_intensity={simon_data.flash_intensity}
		{center_text}
		{is_color_lit}
		on_button_pointer_down={(e, color) => simon_board_input.on_button_pointer_down(e, color)}
		on_button_release={() => simon_board_input.on_button_release()}
		on_center_click={() => simon_board_input.on_center_click()}
	/>
</T.Group>
