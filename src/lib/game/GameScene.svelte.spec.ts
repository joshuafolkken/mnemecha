import { describe, it, expect, afterEach, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { flushSync } from 'svelte';
import GameScene from './GameScene.svelte';
import { audio } from '$lib/game/audio';
import { device } from '$lib/game/device.svelte';
import { fullscreen } from '$lib/game/fullscreen.svelte';
import { fullscreen_switch_input } from '$lib/game/fullscreen-switch-input';

const HINT = 'Click to play';
const LABEL_JUMP = 'JUMP';
const LABEL_GAME = 'Simon game';
const LABEL_GAME_STARTED = 'Game started';

describe('GameScene', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('renders game-scene container', () => {
		const { container } = render(GameScene, {
			props: {
				label_jump: LABEL_JUMP,
				label_game: LABEL_GAME,
				label_game_started: LABEL_GAME_STARTED
			}
		});
		expect(container.querySelector('[data-testid="game-scene"]')).toBeTruthy();
		expect(container.querySelector('[data-testid="jump-btn"]')?.textContent?.trim()).toBe(
			LABEL_JUMP
		);
	});

	it('renders a canvas element', () => {
		const { container } = render(GameScene, {
			props: {
				label_jump: LABEL_JUMP,
				label_game: LABEL_GAME,
				label_game_started: LABEL_GAME_STARTED
			}
		});
		expect(container.querySelector('canvas')).toBeTruthy();
	});

	it('shows hint_text before the session starts', () => {
		const { container } = render(GameScene, {
			props: {
				hint_text: HINT,
				label_jump: LABEL_JUMP,
				label_game: LABEL_GAME,
				label_game_started: LABEL_GAME_STARTED
			}
		});
		expect(container.querySelector('.click-hint')?.textContent?.trim()).toBe(HINT);
	});

	it('hides the click-hint after the session starts', () => {
		const { container } = render(GameScene, {
			props: {
				hint_text: HINT,
				label_jump: LABEL_JUMP,
				label_game: LABEL_GAME,
				label_game_started: LABEL_GAME_STARTED
			}
		});
		const scene = container.querySelector<HTMLElement>('[data-testid="game-scene"]');
		expect(scene).toBeTruthy();
		if (!scene) return;
		expect(container.querySelector('.click-hint')).toBeTruthy();
		scene.click();
		flushSync();
		expect(container.querySelector('.click-hint')).toBeNull();
	});

	it('calls on_start callback when user first clicks', () => {
		let called = false;
		const { container } = render(GameScene, {
			props: {
				label_jump: LABEL_JUMP,
				label_game: LABEL_GAME,
				label_game_started: LABEL_GAME_STARTED,
				on_start: () => {
					called = true;
				}
			}
		});
		const scene = container.querySelector<HTMLElement>('[data-testid="game-scene"]');
		expect(scene).toBeTruthy();
		if (!scene) return;
		scene.click();
		expect(called).toBe(true);
	});

	it('calls on_start only once across multiple clicks', () => {
		let call_count = 0;
		const { container } = render(GameScene, {
			props: {
				label_jump: LABEL_JUMP,
				label_game: LABEL_GAME,
				label_game_started: LABEL_GAME_STARTED,
				on_start: () => {
					call_count++;
				}
			}
		});
		const scene = container.querySelector<HTMLElement>('[data-testid="game-scene"]');
		expect(scene).toBeTruthy();
		if (!scene) return;
		scene.click();
		scene.click();
		scene.click();
		expect(call_count).toBe(1);
	});

	it('start_game runs init_audio only once across multiple clicks', () => {
		const spy = vi.spyOn(audio, 'init_audio');
		const { container } = render(GameScene, {
			props: {
				label_jump: LABEL_JUMP,
				label_game: LABEL_GAME,
				label_game_started: LABEL_GAME_STARTED
			}
		});
		const scene = container.querySelector<HTMLElement>('[data-testid="game-scene"]');
		expect(scene).toBeTruthy();
		if (!scene) return;
		scene.click();
		scene.click();
		scene.click();
		expect(spy).toHaveBeenCalledTimes(1);
	});

	it('start_game requests fullscreen on touch-primary devices', () => {
		vi.spyOn(device, 'is_touch_primary', 'get').mockReturnValue(true);
		const fullscreen_spy = vi.spyOn(fullscreen, 'request').mockResolvedValue();
		const { container } = render(GameScene, {
			props: {
				label_jump: LABEL_JUMP,
				label_game: LABEL_GAME,
				label_game_started: LABEL_GAME_STARTED
			}
		});
		const scene = container.querySelector<HTMLElement>('[data-testid="game-scene"]');
		expect(scene).toBeTruthy();
		if (!scene) return;
		scene.click();
		expect(fullscreen_spy).toHaveBeenCalledTimes(1);
	});

	it('start_game does not request fullscreen on desktop devices but still inits audio', () => {
		vi.spyOn(device, 'is_touch_primary', 'get').mockReturnValue(false);
		const fullscreen_spy = vi.spyOn(fullscreen, 'request').mockResolvedValue();
		const audio_spy = vi.spyOn(audio, 'init_audio');
		const { container } = render(GameScene, {
			props: {
				label_jump: LABEL_JUMP,
				label_game: LABEL_GAME,
				label_game_started: LABEL_GAME_STARTED
			}
		});
		const scene = container.querySelector<HTMLElement>('[data-testid="game-scene"]');
		expect(scene).toBeTruthy();
		if (!scene) return;
		scene.click();
		expect(fullscreen_spy).not.toHaveBeenCalled();
		expect(audio_spy).toHaveBeenCalledTimes(1);
	});

	it('registers the game-scene container with fullscreen_switch_input on mount', () => {
		const spy = vi.spyOn(fullscreen_switch_input, 'set_container');
		const { container } = render(GameScene, {
			props: {
				label_jump: LABEL_JUMP,
				label_game: LABEL_GAME,
				label_game_started: LABEL_GAME_STARTED
			}
		});
		const scene = container.querySelector<HTMLElement>('[data-testid="game-scene"]');
		expect(scene).toBeTruthy();
		expect(spy).toHaveBeenCalledWith(scene);
	});
});
