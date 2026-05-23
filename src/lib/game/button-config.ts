import type { ButtonColor } from './types'

export const INNER_RADIUS = 0.3
export const OUTER_RADIUS = 0.7
export const THETA_SEGMENTS = 32
export const CIRCLE_SEGMENTS = 32
export const BACKING_SEGMENTS = 64
export const BUTTON_GAP = Math.PI / 36
export const THETA_START = BUTTON_GAP
export const THETA_LENGTH = Math.PI / 2 - BUTTON_GAP * 2
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
		color: 'green' as ButtonColor,
		rotation: 0,
		lit_color: '#00ff00',
		dim_color: '#003300',
		cyber_lit_color: '#00ffaa',
		cyber_dim_color: '#005533',
	},
	{
		color: 'red' as ButtonColor,
		rotation: Math.PI / 2,
		lit_color: '#ff2222',
		dim_color: '#330000',
		cyber_lit_color: '#ff0088',
		cyber_dim_color: '#550022',
	},
	{
		color: 'yellow' as ButtonColor,
		rotation: Math.PI,
		lit_color: '#ffff00',
		dim_color: '#333300',
		cyber_lit_color: '#ffff00',
		cyber_dim_color: '#555500',
	},
	{
		color: 'blue' as ButtonColor,
		rotation: -Math.PI / 2,
		lit_color: '#2266ff',
		dim_color: '#001133',
		cyber_lit_color: '#00ccff',
		cyber_dim_color: '#003355',
	},
] as const satisfies readonly ButtonConfig[]

export function btn_lit_color(btn: ButtonConfig, is_alt: boolean): string {
	return is_alt ? btn.cyber_lit_color : btn.lit_color
}

export function btn_dim_color(btn: ButtonConfig, is_alt: boolean): string {
	return is_alt ? btn.cyber_dim_color : btn.dim_color
}
