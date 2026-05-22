<script lang="ts">
	import {
		credits_scroll,
		game_state,
		HALF_D,
		SceneObjects,
		type SceneObjectsMessages,
	} from '@joshuafolkken/game-kit'
	import { messages } from '$lib/messages'
	import { SCORE_DISPLAY_Z } from '$lib/simon/board-config'
	import { CREDITS_LINE_COUNT, CREDITS_TEXT } from '$lib/simon/credits'
	import { hard_score, hard_simon } from '$lib/simon/hard-simon.svelte'
	import HardSimonScene from '$lib/simon/HardSimonScene.svelte'
	import { score } from '$lib/simon/score.svelte'
	import { simon } from '$lib/simon/simon.svelte'
	import SimonBoard from '$lib/simon/SimonBoard.svelte'

	const { start_z: CREDITS_SCROLL_START_Z, end_z: CREDITS_SCROLL_END_Z } =
		credits_scroll.make_credits_scroll_bounds(CREDITS_LINE_COUNT, HALF_D)

	let score_data = $derived({
		high_score: score.high_score,
		current_score: score.current_score,
		is_new_high_score: score.is_new_high_score,
		high_score_round: score.high_score_round,
		last_cleared_round: score.last_cleared_round,
		format_score: score.format_score,
	})
	let simon_data = $derived({
		active_color: simon.active_color,
		pressed_color: simon.pressed_color,
		phase: simon.phase,
		round: simon.round,
		flash_colors: simon.flash_colors,
		flash_intensity: simon.flash_intensity,
	})

	let hard_score_data = $derived({
		high_score: hard_score.high_score,
		current_score: hard_score.current_score,
		is_new_high_score: hard_score.is_new_high_score,
		high_score_round: hard_score.high_score_round,
		last_cleared_round: hard_score.last_cleared_round,
		format_score: hard_score.format_score,
	})
	let hard_simon_data = $derived({
		active_item: hard_simon.active_item,
		pressed_item: hard_simon.pressed_item,
		phase: hard_simon.phase,
		round: hard_simon.round,
		flash_colors: hard_simon.flash_colors,
		flash_intensity: hard_simon.flash_intensity,
	})

	let is_alt = $derived(game_state.is_alt)
	let is_gameover = $derived(simon.phase === 'gameover' || hard_simon.phase === 'gameover')
	const scene_messages: SceneObjectsMessages = {
		game_title: messages.game_title,
		alt_switch_label: messages.cyber_switch_label,
		score_high_score: messages.score_high_score,
		score_round: messages.score_round,
		score_current: messages.score_current,
	}
</script>

<SceneObjects
	{score_data}
	messages={scene_messages}
	score_display_z={SCORE_DISPLAY_Z}
	{is_gameover}
	credits_text={CREDITS_TEXT}
	credits_start_z={CREDITS_SCROLL_START_Z}
	credits_end_z={CREDITS_SCROLL_END_Z}
>
	{#snippet game_board()}
		<SimonBoard
			{simon_data}
			{is_alt}
			text_gameover={messages.simon_gameover}
			text_round={messages.simon_round}
			text_start={messages.simon_start}
		/>
		<HardSimonScene
			simon_data={hard_simon_data}
			score_data={hard_score_data}
			{is_alt}
			text_gameover={messages.simon_gameover}
			text_round={messages.simon_round}
			text_start={messages.simon_start}
			label_high_score={messages.score_high_score}
			label_round={messages.score_round}
			label_current={messages.score_current}
		/>
	{/snippet}
</SceneObjects>
