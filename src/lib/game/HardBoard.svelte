<script lang="ts">
	import { T } from '@threlte/core'
	import { board_center_label } from './board-center-label'
	import SimonBoardContent from './BoardContent.svelte'
	import { HARD_BOARD_CENTER_INDEX } from './hard-board-config'
	import { hard_simon_board_input } from './hard-board-input'
	import type { ButtonColor, HardBoardIndex, HardSimonBoardData } from './types'

	interface Props {
		board_index: HardBoardIndex
		simon_data: HardSimonBoardData
		is_alt: boolean
		text_gameover: string
		text_start: string
	}

	let { board_index, simon_data, is_alt, text_gameover, text_start }: Props = $props()

	let is_center = $derived(board_index === HARD_BOARD_CENTER_INDEX)

	function is_color_lit(color: ButtonColor): boolean {
		const active = simon_data.active_item
		const pressed = simon_data.pressed_item
		if (active && active.board_index === board_index && active.color === color) return true
		if (pressed && pressed.board_index === board_index && pressed.color === color) return true
		return simon_data.flash_colors.includes(color)
	}

	let center_text = $derived(
		is_center
			? board_center_label.get_center_text({
					phase: simon_data.phase,
					round: simon_data.round,
					text_gameover,
					text_start,
				})
			: '',
	)
	let center_base_font_size = $derived(
		board_center_label.get_center_base_font_size(simon_data.phase, simon_data.round),
	)
	let center_line_height = $derived(board_center_label.get_center_line_height(simon_data.phase))
</script>

<T.Group>
	<SimonBoardContent
		{is_alt}
		flash_intensity={simon_data.flash_intensity}
		{center_text}
		base_font_size={center_base_font_size}
		line_height={center_line_height}
		{is_color_lit}
		on_button_pointer_down={(e, color) =>
			hard_simon_board_input.on_button_pointer_down(e, board_index, color)}
		on_button_release={() => hard_simon_board_input.on_button_release()}
		on_center_click={() => hard_simon_board_input.on_center_click(board_index)}
	/>
</T.Group>
