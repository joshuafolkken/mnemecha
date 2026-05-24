import { HALF_D } from '@joshuafolkken/game-kit'
import { describe, expect, it } from 'vitest'
import { BOARD_Z, SCORE_DISPLAY_Z, SCORE_DISPLAY_Z_OFFSET } from './board-config.js'
import {
	HARD_BOARD_Z,
	HARD_BOARD_Z_OFFSET,
	HARD_SCORE_DISPLAY_Z,
	HARD_SCORE_DISPLAY_Z_OFFSET,
} from './hard-board-config.js'

describe('HARD_BOARD_Z_OFFSET', () => {
	it('places the board the same distance from the back wall as Normal mode', () => {
		const normal_wall_to_board = HALF_D + BOARD_Z
		expect(-HARD_BOARD_Z_OFFSET).toBeCloseTo(normal_wall_to_board)
	})
})

describe('HARD_SCORE_DISPLAY_Z_OFFSET', () => {
	it('places the scoreboard the same distance from the back wall as Normal mode', () => {
		const normal_wall_to_score = HALF_D + SCORE_DISPLAY_Z
		expect(-HARD_SCORE_DISPLAY_Z_OFFSET).toBeCloseTo(normal_wall_to_score)
	})

	it('keeps the scoreboard in front of the board by the Normal-mode offset', () => {
		const hard_board_to_score = HARD_BOARD_Z - HARD_SCORE_DISPLAY_Z
		expect(hard_board_to_score).toBeCloseTo(SCORE_DISPLAY_Z_OFFSET)
	})
})

describe('HARD_SCORE_DISPLAY_Z', () => {
	it('equals HALF_D + HARD_SCORE_DISPLAY_Z_OFFSET', () => {
		expect(HARD_SCORE_DISPLAY_Z).toBeCloseTo(HALF_D + HARD_SCORE_DISPLAY_Z_OFFSET)
	})

	it('sits closer to the room center than HARD_BOARD_Z (scoreboard between player and board)', () => {
		expect(HARD_SCORE_DISPLAY_Z).toBeLessThan(HARD_BOARD_Z)
	})
})
