import { describe, expect, it } from 'vitest'
import { board_center_label } from './board-center-label'
import {
	FONT_SIZE,
	MULTILINE_FONT_SIZE,
	MULTILINE_LINE_HEIGHT,
	ROUND_DIGIT_FONT_SIZE,
	SINGLE_LINE_HEIGHT,
} from './button-config'

const SAMPLE_ROUND = 7

describe('board_center_label.get_center_text', () => {
	it('returns text_start when phase is idle and round is 0', () => {
		const text = board_center_label.get_center_text({
			phase: 'idle',
			round: 0,
			text_gameover: 'GAME OVER',
			text_start: 'START',
		})

		expect(text).toBe('START')
	})

	it('returns the round digit only when round is in progress', () => {
		const text = board_center_label.get_center_text({
			phase: 'showing',
			round: SAMPLE_ROUND,
			text_gameover: 'GAME OVER',
			text_start: 'START',
		})

		expect(text).toBe(String(SAMPLE_ROUND))
	})

	it('renders gameover as a 2-line label by replacing the first space with a newline', () => {
		const text = board_center_label.get_center_text({
			phase: 'gameover',
			round: SAMPLE_ROUND,
			text_gameover: 'GAME OVER',
			text_start: 'START',
		})

		expect(text).toBe('GAME\nOVER')
	})

	it('falls back to text_gameover unchanged when it has no space (single-word locales)', () => {
		const text = board_center_label.get_center_text({
			phase: 'gameover',
			round: 0,
			text_gameover: 'GAMEOVER',
			text_start: 'START',
		})

		expect(text).toBe('GAMEOVER')
	})
})

describe('board_center_label.get_center_base_font_size', () => {
	it('uses FONT_SIZE for the idle START state', () => {
		expect(board_center_label.get_center_base_font_size('idle', 0)).toBe(FONT_SIZE)
	})

	it('uses ROUND_DIGIT_FONT_SIZE while a round is in progress', () => {
		expect(board_center_label.get_center_base_font_size('showing', SAMPLE_ROUND)).toBe(
			ROUND_DIGIT_FONT_SIZE,
		)
	})

	it('uses MULTILINE_FONT_SIZE for the gameover state regardless of round', () => {
		expect(board_center_label.get_center_base_font_size('gameover', SAMPLE_ROUND)).toBe(
			MULTILINE_FONT_SIZE,
		)
		expect(board_center_label.get_center_base_font_size('gameover', 0)).toBe(MULTILINE_FONT_SIZE)
	})
})

describe('board_center_label.get_center_line_height', () => {
	it('uses SINGLE_LINE_HEIGHT for non-gameover states', () => {
		expect(board_center_label.get_center_line_height('idle')).toBe(SINGLE_LINE_HEIGHT)
		expect(board_center_label.get_center_line_height('showing')).toBe(SINGLE_LINE_HEIGHT)
	})

	it('uses MULTILINE_LINE_HEIGHT for the 2-line gameover label', () => {
		expect(board_center_label.get_center_line_height('gameover')).toBe(MULTILINE_LINE_HEIGHT)
	})
})
