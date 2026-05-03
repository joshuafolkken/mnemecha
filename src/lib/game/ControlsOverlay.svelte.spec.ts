import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ControlsOverlay from './ControlsOverlay.svelte';

const HINT = 'CLICK TO START';

describe('ControlsOverlay', () => {
	it('renders the hint text', () => {
		const { container } = render(ControlsOverlay, { props: { hint_text: HINT, is_touch: false } });
		expect(container.querySelector('[data-testid="start-hint"]')?.textContent?.trim()).toBe(HINT);
	});

	it('shows PC controls layout on desktop', () => {
		const { container } = render(ControlsOverlay, { props: { hint_text: HINT, is_touch: false } });
		expect(container.querySelector('[data-testid="controls-pc"]')).toBeTruthy();
		expect(container.querySelector('[data-testid="controls-touch"]')).toBeNull();
	});

	it('shows mobile controls layout on touch device', () => {
		const { container } = render(ControlsOverlay, { props: { hint_text: HINT, is_touch: true } });
		expect(container.querySelector('[data-testid="controls-touch"]')).toBeTruthy();
		expect(container.querySelector('[data-testid="controls-pc"]')).toBeNull();
	});

	it('renders the controls-overlay container', () => {
		const { container } = render(ControlsOverlay, { props: { hint_text: HINT, is_touch: false } });
		expect(container.querySelector('[data-testid="controls-overlay"]')).toBeTruthy();
	});

	it('renders the dark backdrop overlay', () => {
		const { container } = render(ControlsOverlay, { props: { hint_text: HINT, is_touch: false } });
		expect(container.querySelector('[data-testid="overlay-backdrop"]')).toBeTruthy();
	});

	it('start hint uses Orbitron (CYBER) font', () => {
		const { container } = render(ControlsOverlay, { props: { hint_text: HINT, is_touch: false } });
		const hint = container.querySelector<HTMLElement>('[data-testid="start-hint"]');
		expect(hint).toBeTruthy();
		const font = globalThis.getComputedStyle(hint!).fontFamily;
		expect(font).toContain('Orbitron');
	});
});
