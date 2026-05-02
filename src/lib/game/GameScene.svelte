<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Canvas } from '@threlte/core';
	import { Suspense } from '@threlte/extras';
	import { onMount } from 'svelte';
	import VirtualJoystick from './VirtualJoystick.svelte';
	import { input } from '$lib/game/input.svelte';
	import { audio } from '$lib/game/audio';
	import { fullscreen } from '$lib/game/fullscreen.svelte';
	import { fullscreen_switch_input } from '$lib/game/fullscreen-switch-input';
	import { loading } from '$lib/game/loading.svelte';
	import { device } from '$lib/game/device.svelte';

	interface Props {
		children?: Snippet;
		overlay?: Snippet;
		hint_text?: string;
		hint_font_family?: string;
		hint_font_size_rem?: number;
		on_start?: () => void;
		label_jump: string;
		label_game: string;
		label_game_started: string;
	}

	let {
		children,
		overlay,
		hint_text = '',
		hint_font_family,
		hint_font_size_rem = 1,
		on_start,
		label_jump,
		label_game,
		label_game_started
	}: Props = $props();

	let container: HTMLElement;
	let is_started = $state(false);
	let is_dragging_look = $derived(input.is_dragging_look);
	let drag_start_x = $derived(input.drag_start_x);
	let drag_start_y = $derived(input.drag_start_y);
	let is_pseudo_fullscreen = $derived(fullscreen.is_pseudo_fullscreen);
	let game_status = $derived(is_started ? label_game_started : '');

	function start_game(): void {
		if (is_started) return;
		audio.init_audio();
		if (container && device.is_touch_primary) void fullscreen.request(container);
		is_started = true;
		on_start?.();
	}

	function on_key_down(event: KeyboardEvent): void {
		if (event.key !== 'Enter' && event.key !== ' ') return;
		event.preventDefault();
		start_game();
	}

	function on_scene_loaded(): void {
		loading.set_step('ready');
		loading.mark_ready();
	}

	onMount(() => {
		loading.set_step('loading_assets');
		fullscreen_switch_input.set_container(container);
		const canvas_el = container.querySelector<HTMLCanvasElement>('canvas');
		if (!canvas_el)
			console.warn('[GameScene] No <canvas> found at mount — synthetic pointer events disabled');
		const cleanup_input = input.setup_listeners(canvas_el);
		const cleanup_fullscreen = fullscreen.setup_listeners();
		return function cleanup(): void {
			cleanup_input();
			cleanup_fullscreen();
			fullscreen_switch_input.set_container(null);
		};
	});
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
	class="game-container"
	class:pseudo-fullscreen={is_pseudo_fullscreen}
	class:is-dragging-look={is_dragging_look}
	bind:this={container}
	role="application"
	tabindex="0"
	aria-label={label_game}
	onclick={start_game}
	onkeydown={on_key_down}
	data-testid="game-scene"
>
	<div role="status" class="sr-only">{game_status}</div>
	{#if !is_started}
		<div
			class="click-hint"
			aria-live="polite"
			style:font-family={hint_font_family}
			style:font-size="{hint_font_size_rem}rem"
		>
			{hint_text}
		</div>
	{/if}
	{@render overlay?.()}
	<Canvas>
		<Suspense onload={on_scene_loaded}>
			{@render children?.()}
		</Suspense>
	</Canvas>
	<VirtualJoystick {label_jump} />
	{#if is_dragging_look}
		<svg
			class="fake-cursor"
			data-testid="fake-cursor"
			aria-hidden="true"
			width="20"
			height="20"
			viewBox="0 0 20 20"
			style:left="{drag_start_x}px"
			style:top="{drag_start_y}px"
		>
			<path
				d="M2 2 L2 16 L6 12 L9 18 L11 17 L8 11 L13 11 Z"
				fill="white"
				stroke="black"
				stroke-width="1"
				stroke-linejoin="round"
			/>
		</svg>
	{/if}
</div>

<style>
	.game-container {
		position: relative;
		width: 100%;
		height: 100vh;
		background: #0d0d12;
	}

	.game-container.pseudo-fullscreen {
		position: fixed;
		inset: 0;
		width: 100vw;
		height: 100vh;
		z-index: 9999;
	}

	.game-container.is-dragging-look {
		cursor: none;
	}

	.fake-cursor {
		position: fixed;
		pointer-events: none;
		z-index: 100;
		transform: translate(-2px, -2px);
	}

	.click-hint {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		color: rgba(255, 255, 255, 0.6);
		font-size: 1rem;
		letter-spacing: 0.2em;
		pointer-events: none;
		z-index: 10;
	}
</style>
