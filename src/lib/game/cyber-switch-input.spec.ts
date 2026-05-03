import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { cyber_switch_input } from './cyber-switch-input';
import { session } from './session.svelte';
import { game_state } from './state.svelte';
import { switch_audio } from '$lib/game/switch-audio';

describe('cyber_switch_input', () => {
	beforeEach(() => {
		session.reset_session();
		if (game_state.is_alt) game_state.toggle_alt();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('does not toggle alt mode when session is not started', () => {
		cyber_switch_input.on_click();
		expect(game_state.is_alt).toBe(false);
	});

	it('toggles alt mode once session has started', () => {
		session.start_session();
		cyber_switch_input.on_click();
		expect(game_state.is_alt).toBe(true);
	});

	it('toggles alt mode twice when clicked twice after session started', () => {
		session.start_session();
		cyber_switch_input.on_click();
		cyber_switch_input.on_click();
		expect(game_state.is_alt).toBe(false);
	});

	it('plays switch click sound when session is started', () => {
		session.start_session();
		const spy = vi.spyOn(switch_audio, 'play_switch_click').mockImplementation(() => {});
		cyber_switch_input.on_click();
		expect(spy).toHaveBeenCalledTimes(1);
	});

	it('does not play switch click sound when session is not started', () => {
		const spy = vi.spyOn(switch_audio, 'play_switch_click').mockImplementation(() => {});
		cyber_switch_input.on_click();
		expect(spy).not.toHaveBeenCalled();
	});
});
