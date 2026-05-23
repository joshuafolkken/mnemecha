<script lang="ts">
	import { T } from '@threlte/core'
	import { board_center_label } from './board-center-label'
	import { BOARD_Y, BOARD_Z } from './board-config'
	import { simon_board_input } from './board-input'
	import SimonBoardContent from './BoardContent.svelte'
	import type { ButtonColor, SimonBoardData } from './types'

	interface Props {
		simon_data: SimonBoardData
		is_alt: boolean
		text_gameover: string
		text_start: string
	}

	let { simon_data, is_alt, text_gameover, text_start }: Props = $props()

	function is_color_lit(color: ButtonColor): boolean {
		return (
			simon_data.active_color === color ||
			simon_data.pressed_color === color ||
			simon_data.flash_colors.includes(color)
		)
	}

	let center_text = $derived(
		board_center_label.get_center_text({
			phase: simon_data.phase,
			round: simon_data.round,
			text_gameover,
			text_start,
		}),
	)
	let center_base_font_size = $derived(
		board_center_label.get_center_base_font_size(simon_data.phase, simon_data.round),
	)
	let center_line_height = $derived(board_center_label.get_center_line_height(simon_data.phase))
</script>

<T.Group position={[0, BOARD_Y, BOARD_Z]}>
	<SimonBoardContent
		{is_alt}
		flash_intensity={simon_data.flash_intensity}
		{center_text}
		base_font_size={center_base_font_size}
		line_height={center_line_height}
		{is_color_lit}
		on_button_pointer_down={(e, color) => simon_board_input.on_button_pointer_down(e, color)}
		on_button_release={() => simon_board_input.on_button_release()}
		on_center_click={() => simon_board_input.on_center_click()}
	/>
</T.Group>
