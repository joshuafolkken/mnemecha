<script lang="ts">
	import { ScoreDisplay, type ScoreData } from '@joshuafolkken/game-kit'
	import { T } from '@threlte/core'
	import {
		HARD_BOARD_X_CENTER,
		HARD_BOARD_X_LEFT,
		HARD_BOARD_X_RIGHT,
		HARD_BOARD_Y,
		HARD_BOARD_Z,
		HARD_SCORE_DISPLAY_Z,
	} from './hard-board-config'
	import HardSimonBoard from './HardBoard.svelte'
	import type { HardBoardIndex, HardSimonBoardData } from './types'

	interface Props {
		simon_data: HardSimonBoardData
		score_data: ScoreData
		is_alt: boolean
		text_gameover: string
		text_start: string
		label_high_score: string
		label_round: string
		label_current: string
	}

	let {
		simon_data,
		score_data,
		is_alt,
		text_gameover,
		text_start,
		label_high_score,
		label_round,
		label_current,
	}: Props = $props()

	const BOARD_POSITIONS = [
		{ index: 0 as HardBoardIndex, x: HARD_BOARD_X_LEFT },
		{ index: 1 as HardBoardIndex, x: HARD_BOARD_X_CENTER },
		{ index: 2 as HardBoardIndex, x: HARD_BOARD_X_RIGHT },
	] as const
</script>

<T.Group rotation.y={Math.PI}>
	{#each BOARD_POSITIONS as board (board.index)}
		<T.Group position={[board.x, HARD_BOARD_Y, -HARD_BOARD_Z]}>
			<HardSimonBoard
				board_index={board.index}
				{simon_data}
				{is_alt}
				{text_gameover}
				{text_start}
			/>
		</T.Group>
	{/each}

	<ScoreDisplay
		{score_data}
		{is_alt}
		position_z={-HARD_SCORE_DISPLAY_Z}
		{label_high_score}
		{label_round}
		{label_current}
	/>
</T.Group>
