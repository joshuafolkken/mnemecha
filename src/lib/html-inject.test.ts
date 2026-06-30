import { game_config } from '$lib/game-config'
import { describe, expect, it } from 'vitest'
import { html_inject } from './html-inject'

const TEST_VERSION = '1.2.3'
const TEST_PLACEHOLDER = '__X__'
const NO_PLACEHOLDER_HTML = '<p>no placeholder here</p>'
const PLAIN_TEXT = 'plain text'
const DOLLAR_VERSION = '1.0.0-$beta'

describe('html_escape', () => {
	it('escapes the HTML-sensitive characters', () => {
		expect(html_inject.html_escape(`&<>"'`)).toBe('&amp;&lt;&gt;&quot;&#039;')
	})

	it('passes through a value with no special characters', () => {
		expect(html_inject.html_escape(PLAIN_TEXT)).toBe(PLAIN_TEXT)
	})
})

describe('inject_placeholder', () => {
	it('replaces all occurrences of the placeholder', () => {
		const html = `${TEST_PLACEHOLDER} and ${TEST_PLACEHOLDER}`

		expect(html_inject.inject_placeholder(html, TEST_PLACEHOLDER, 'v')).toBe('v and v')
	})

	it('inserts a value containing `$` verbatim', () => {
		expect(html_inject.inject_placeholder(TEST_PLACEHOLDER, TEST_PLACEHOLDER, DOLLAR_VERSION)).toBe(
			DOLLAR_VERSION,
		)
	})

	it('passes through html that has no placeholder', () => {
		expect(html_inject.inject_placeholder(NO_PLACEHOLDER_HTML, TEST_PLACEHOLDER, 'v')).toBe(
			NO_PLACEHOLDER_HTML,
		)
	})
})

describe('inject_version', () => {
	it('replaces the placeholder with the given version', () => {
		const html = '<p class="game-version">v__APP_VERSION__</p>'

		expect(html_inject.inject_version(html, TEST_VERSION)).toBe(
			`<p class="game-version">v${TEST_VERSION}</p>`,
		)
	})

	it('replaces every version placeholder occurrence', () => {
		const html = '__APP_VERSION__ and __APP_VERSION__'

		expect(html_inject.inject_version(html, TEST_VERSION)).toBe(
			`${TEST_VERSION} and ${TEST_VERSION}`,
		)
	})

	it('passes through html with no version placeholder', () => {
		expect(html_inject.inject_version(NO_PLACEHOLDER_HTML, TEST_VERSION)).toBe(NO_PLACEHOLDER_HTML)
	})
})

describe('inject_game_name', () => {
	it('substitutes __GAME_NAME_DISPLAY__ with the title-case brand', () => {
		const html = '<title>__GAME_NAME_DISPLAY__</title>'

		expect(html_inject.inject_game_name(html)).toBe(
			`<title>${game_config.GAME_NAME_DISPLAY}</title>`,
		)
	})

	it('substitutes __GAME_NAME_UPPER__ with the upper-case brand', () => {
		const html = '<p class="game-title">__GAME_NAME_UPPER__</p>'

		expect(html_inject.inject_game_name(html)).toBe(
			`<p class="game-title">${game_config.GAME_NAME_UPPER}</p>`,
		)
	})

	it('substitutes both placeholders when present', () => {
		const html = '__GAME_NAME_DISPLAY__ / __GAME_NAME_UPPER__'

		expect(html_inject.inject_game_name(html)).toBe(
			`${game_config.GAME_NAME_DISPLAY} / ${game_config.GAME_NAME_UPPER}`,
		)
	})

	it('passes through html that has no placeholders', () => {
		const html = '<p>plain content</p>'

		expect(html_inject.inject_game_name(html)).toBe(html)
	})
})
