import { game_state } from '@joshuafolkken/game-kit'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-svelte'
import Page from './+page.svelte'

const CYBER_GLOW_SELECTOR = '[data-testid="cyber-glow"]'

describe('Home page', () => {
	beforeEach(() => {
		if (game_state.is_alt) game_state.toggle_alt()
	})

	afterEach(() => {
		if (game_state.is_alt) game_state.toggle_alt()
	})

	it('does not render cyber-glow in normal mode', async () => {
		const { container } = await render(Page)

		expect(container.querySelector(CYBER_GLOW_SELECTOR)).toBeNull()
	})

	it('renders cyber-glow when cyber mode is active', async () => {
		game_state.toggle_alt()
		const { container } = await render(Page)

		expect(container.querySelector(CYBER_GLOW_SELECTOR)).toBeTruthy()
	})
})
