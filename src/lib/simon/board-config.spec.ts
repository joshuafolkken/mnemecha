import { describe, it, expect } from 'vitest';
import {
	BOARD_Y,
	BOARD_Z,
	BOARD_LABEL_Z,
	SCORE_DISPLAY_Z_OFFSET,
	SCORE_DISPLAY_Z
} from './board-config.js';

describe('BOARD_LABEL_Z', () => {
	it('floats text in front of the board backing (0.05)', () => {
		expect(BOARD_LABEL_Z).toBe(0.05);
	});

	it('is positive (in front of board face)', () => {
		expect(BOARD_LABEL_Z).toBeGreaterThan(0);
	});
});

describe('BOARD_Y', () => {
	it('is defined', () => {
		expect(BOARD_Y).toBeDefined();
	});
});

describe('BOARD_Z', () => {
	it('is negative (behind origin)', () => {
		expect(BOARD_Z).toBeLessThan(0);
	});
});

describe('SCORE_DISPLAY_Z_OFFSET', () => {
	it('is positive (score display floats in front of board)', () => {
		expect(SCORE_DISPLAY_Z_OFFSET).toBeGreaterThan(0);
	});
});

describe('SCORE_DISPLAY_Z', () => {
	it('equals BOARD_Z + SCORE_DISPLAY_Z_OFFSET', () => {
		expect(SCORE_DISPLAY_Z).toBeCloseTo(BOARD_Z + SCORE_DISPLAY_Z_OFFSET);
	});

	it('is in front of BOARD_Z (closer to camera)', () => {
		expect(SCORE_DISPLAY_Z).toBeGreaterThan(BOARD_Z);
	});
});
