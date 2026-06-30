import { describe, expect, it } from 'vitest'
import {
	FONT_SIZE,
	MULTILINE_FONT_SIZE,
	MULTILINE_LINE_HEIGHT,
	ROUND_DIGIT_FONT_SIZE,
	SINGLE_LINE_HEIGHT,
} from './button-config'

describe('board center label font sizes', () => {
	it('FONT_SIZE pins the single-line START size at 0.13', () => {
		expect(FONT_SIZE).toBeCloseTo(0.13, 5)
	})

	it('MULTILINE_FONT_SIZE pins the per-line GAME OVER size at 0.16', () => {
		expect(MULTILINE_FONT_SIZE).toBeCloseTo(0.16, 5)
	})

	it('ROUND_DIGIT_FONT_SIZE pins the digit-only ROUND size at 0.2', () => {
		expect(ROUND_DIGIT_FONT_SIZE).toBeCloseTo(0.2, 5)
	})

	it('ROUND_DIGIT_FONT_SIZE is the largest center label size', () => {
		expect(ROUND_DIGIT_FONT_SIZE).toBeGreaterThan(MULTILINE_FONT_SIZE)
		expect(ROUND_DIGIT_FONT_SIZE).toBeGreaterThan(FONT_SIZE)
	})

	it('MULTILINE_FONT_SIZE is larger than the single-line START size', () => {
		expect(MULTILINE_FONT_SIZE).toBeGreaterThan(FONT_SIZE)
	})
})

describe('board center label line heights', () => {
	it('MULTILINE_LINE_HEIGHT pins the GAME OVER breathing room at 1.4', () => {
		expect(MULTILINE_LINE_HEIGHT).toBeCloseTo(1.4, 5)
	})

	it('SINGLE_LINE_HEIGHT pins the default single-line height at 1', () => {
		expect(SINGLE_LINE_HEIGHT).toBe(1)
	})

	it('MULTILINE_LINE_HEIGHT adds breathing room above the single-line default', () => {
		expect(MULTILINE_LINE_HEIGHT).toBeGreaterThan(SINGLE_LINE_HEIGHT)
	})
})
