import { describe, it, expect, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import SimonScene from './SimonScene.svelte';

vi.mock('$lib/game/SceneObjects.svelte', () => ({ default: function SceneObjects() {} }));
vi.mock('$lib/simon/SimonBoard.svelte', () => ({ default: function SimonBoard() {} }));
vi.mock('$lib/simon/board-config', () => ({ BOARD_Z: -4.8 }));
vi.mock('$lib/game/state.svelte', () => ({ game_state: { is_alt: false } }));
vi.mock('$lib/messages/en', () => ({
	messages: {
		game_title: 'SIMON',
		cyber_switch_label: 'CYBER',
		fullscreen_switch_label: 'FULLSCREEN',
		score_high_score: 'HI',
		score_round: 'RND',
		score_current: 'SCORE',
		simon_gameover: 'GAME OVER',
		simon_round: 'ROUND',
		simon_start: 'START'
	}
}));
vi.mock('$lib/simon/simon.svelte', () => ({
	simon: {
		active_color: null,
		pressed_color: null,
		phase: 'idle',
		round: 0,
		flash_colors: [],
		flash_intensity: 1
	}
}));
vi.mock('$lib/simon/score.svelte', () => ({
	score: {
		high_score: 0,
		current_score: 0,
		is_new_high_score: false,
		high_score_round: 0,
		last_cleared_round: 0,
		format_score: String
	}
}));
vi.mock('$lib/simon/credits', () => ({
	CREDITS_TEXT: 'Credits',
	CREDITS_LINE_COUNT: 1
}));
vi.mock('$lib/game/credits-config', () => ({
	make_credits_scroll_bounds: vi.fn(() => ({ start_z: 10, end_z: -10 }))
}));
vi.mock('$lib/game/room-config', () => ({ ROOM_W: 10, ROOM_D: 10, ROOM_H: 5, HALF_D: 5 }));

describe('SimonScene', () => {
	it('renders without error', () => {
		const { container } = render(SimonScene);
		expect(container).toBeTruthy();
	});
});
