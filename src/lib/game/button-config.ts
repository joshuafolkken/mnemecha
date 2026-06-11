import type { ButtonColor } from './types'

const BUTTON_GAP_DIVISOR = 36
const HALF_TURN_DIVISOR = 2
const BUTTON_GAP_MULTIPLIER = 2

export const INNER_RADIUS = 0.3
export const OUTER_RADIUS = 0.7
export const THETA_SEGMENTS = 32
export const CIRCLE_SEGMENTS = 32
export const BACKING_SEGMENTS = 64
export const BUTTON_GAP = Math.PI / BUTTON_GAP_DIVISOR
export const THETA_START = BUTTON_GAP
export const THETA_LENGTH = Math.PI / HALF_TURN_DIVISOR - BUTTON_GAP * BUTTON_GAP_MULTIPLIER
export const BACKING_RADIUS = 0.85
export const CENTER_RADIUS = 0.22
export const BACKING_Z = -0.01
export const FONT_SIZE = 0.13
export const MULTILINE_FONT_SIZE = 0.16
export const ROUND_DIGIT_FONT_SIZE = 0.2
export const MULTILINE_LINE_HEIGHT = 1.4
export const SINGLE_LINE_HEIGHT = 1
export const EMISSIVE_INTENSITY = 0.8
export const CYBER_EMISSIVE_INTENSITY = 1.5

export interface ButtonConfig {
	color: ButtonColor
	rotation: number
	lit_color: string
	dim_color: string
	cyber_lit_color: string
	cyber_dim_color: string
}

export const BUTTON_CONFIGS = [
	{
		color: 'green',
		rotation: 0,
		lit_color: '#00ff00',
		dim_color: '#003300',
		cyber_lit_color: '#00ffaa',
		cyber_dim_color: '#005533',
	},
	{
		color: 'red',
		rotation: Math.PI / HALF_TURN_DIVISOR,
		lit_color: '#ff2222',
		dim_color: '#330000',
		cyber_lit_color: '#ff0088',
		cyber_dim_color: '#550022',
	},
	{
		color: 'yellow',
		rotation: Math.PI,
		lit_color: '#ffff00',
		dim_color: '#333300',
		cyber_lit_color: '#ffff00',
		cyber_dim_color: '#555500',
	},
	{
		color: 'blue',
		rotation: -Math.PI / HALF_TURN_DIVISOR,
		lit_color: '#2266ff',
		dim_color: '#001133',
		cyber_lit_color: '#00ccff',
		cyber_dim_color: '#003355',
	},
] as const satisfies ReadonlyArray<ButtonConfig>

function btn_lit_color(btn: ButtonConfig, is_alt: boolean): string {
	return is_alt ? btn.cyber_lit_color : btn.lit_color
}

function btn_dim_color(btn: ButtonConfig, is_alt: boolean): string {
	return is_alt ? btn.cyber_dim_color : btn.dim_color
}

export { btn_lit_color, btn_dim_color }
