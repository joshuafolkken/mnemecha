import {
	FONT_SIZE,
	MULTILINE_FONT_SIZE,
	MULTILINE_LINE_HEIGHT,
	ROUND_DIGIT_FONT_SIZE,
	SINGLE_LINE_HEIGHT,
} from './button-config'

interface BoardCenterLabelInput {
	phase: string
	round: number
	text_gameover: string
	text_start: string
}

function get_center_text(input: BoardCenterLabelInput): string {
	if (input.phase === 'gameover') return input.text_gameover.replace(' ', '\n')
	if (input.round > 0) return String(input.round)
	return input.text_start
}

function get_center_base_font_size(phase: string, round: number): number {
	if (phase === 'gameover') return MULTILINE_FONT_SIZE
	if (round > 0) return ROUND_DIGIT_FONT_SIZE
	return FONT_SIZE
}

function get_center_line_height(phase: string): number {
	if (phase === 'gameover') return MULTILINE_LINE_HEIGHT
	return SINGLE_LINE_HEIGHT
}

export const board_center_label = {
	get_center_text,
	get_center_base_font_size,
	get_center_line_height,
}
