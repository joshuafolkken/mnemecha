import { describe, it, expect, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ScoreDisplay from './ScoreDisplay.svelte';
import type { ScoreData } from '$lib/game/score-display-types';

vi.mock('@threlte/core', () => ({ T: {}, useTask: vi.fn() }));
vi.mock('@threlte/extras', () => ({ Text: {} }));

function make_score_data(overrides: Partial<ScoreData> = {}): ScoreData {
	return {
		high_score: 1000,
		current_score: 500,
		is_new_high_score: false,
		high_score_round: 3,
		last_cleared_round: 2,
		format_score: (v: number) => String(v),
		...overrides
	};
}

const LABEL_PROPS = { label_high_score: 'HI', label_round: 'RND', label_current: 'SCORE' };

describe('ScoreDisplay', () => {
	it('renders without error in normal mode', () => {
		const { container } = render(ScoreDisplay, {
			props: { score_data: make_score_data(), is_alt: false, position_z: -4.65, ...LABEL_PROPS }
		});
		expect(container).toBeTruthy();
	});

	it('renders without error in alt mode', () => {
		const { container } = render(ScoreDisplay, {
			props: { score_data: make_score_data(), is_alt: true, position_z: -4.65, ...LABEL_PROPS }
		});
		expect(container).toBeTruthy();
	});

	it('accepts is_new_high_score flag via score_data', () => {
		const { container } = render(ScoreDisplay, {
			props: {
				score_data: make_score_data({ is_new_high_score: true }),
				is_alt: false,
				position_z: -4.65,
				...LABEL_PROPS
			}
		});
		expect(container).toBeTruthy();
	});

	it('accepts custom format_score function via score_data', () => {
		const format_score = vi.fn((v: number) => `${v} pts`);
		render(ScoreDisplay, {
			props: {
				score_data: make_score_data({ format_score }),
				is_alt: false,
				position_z: -4.65,
				...LABEL_PROPS
			}
		});
		expect(format_score).toBeDefined();
	});
});
