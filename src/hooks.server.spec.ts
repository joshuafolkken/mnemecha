import { readFileSync } from 'node:fs'
import type { RequestEvent, ResolveOptions } from '@sveltejs/kit'
import { game_config } from '$lib/game-config'
import { describe, expect, it, vi } from 'vitest'
import { build_legacy_redirect, handle, inject_game_name, inject_version } from './hooks.server'

const { version } = JSON.parse(
	readFileSync(new URL('../package.json', import.meta.url), 'utf-8'),
) as { version: string }

const DEFAULT_EVENT_URL = 'https://mnemecha.joshuafolkken.com/'
const LEGACY_HOSTNAME = 'simon.joshuafolkken.com'
const NEW_HOSTNAME = 'mnemecha.joshuafolkken.com'
const PERMANENT_REDIRECT_STATUS = 301

type ResolveFn = (event: RequestEvent, opts?: ResolveOptions) => Promise<Response>

function make_resolve(): ResolveFn {
	return vi.fn<ResolveFn>().mockResolvedValue(new Response(null, { status: 200 }))
}

function make_event(url: string = DEFAULT_EVENT_URL): RequestEvent {
	return { url: new URL(url) } as RequestEvent
}

describe('inject_version', () => {
	it('replaces the placeholder with the package version', () => {
		const html = '<p class="game-version">v__APP_VERSION__</p>'
		expect(inject_version(html)).toBe(`<p class="game-version">v${version}</p>`)
	})

	it('replaces all occurrences of the placeholder', () => {
		const html = '__APP_VERSION__ and __APP_VERSION__'
		expect(inject_version(html)).toBe(`${version} and ${version}`)
	})

	it('passes through html that has no placeholder', () => {
		const html = '<p>no placeholder here</p>'
		expect(inject_version(html)).toBe(html)
	})
})

describe('inject_game_name', () => {
	it('substitutes __GAME_NAME_DISPLAY__ with the title-case brand', () => {
		const html = '<title>__GAME_NAME_DISPLAY__</title>'
		expect(inject_game_name(html)).toBe(`<title>${game_config.GAME_NAME_DISPLAY}</title>`)
	})

	it('substitutes __GAME_NAME_UPPER__ with the upper-case brand', () => {
		const html = '<p class="game-title">__GAME_NAME_UPPER__</p>'
		expect(inject_game_name(html)).toBe(`<p class="game-title">${game_config.GAME_NAME_UPPER}</p>`)
	})

	it('substitutes both placeholders when present', () => {
		const html = '__GAME_NAME_DISPLAY__ / __GAME_NAME_UPPER__'
		expect(inject_game_name(html)).toBe(
			`${game_config.GAME_NAME_DISPLAY} / ${game_config.GAME_NAME_UPPER}`,
		)
	})

	it('passes through html that has no placeholders', () => {
		const html = '<p>plain content</p>'
		expect(inject_game_name(html)).toBe(html)
	})
})

describe('handle', () => {
	it('adds X-Frame-Options: SAMEORIGIN', async () => {
		const response = await handle({ event: make_event(), resolve: make_resolve() })
		expect(response.headers.get('x-frame-options')).toBe('SAMEORIGIN')
	})

	it('adds X-Content-Type-Options: nosniff', async () => {
		const response = await handle({ event: make_event(), resolve: make_resolve() })
		expect(response.headers.get('x-content-type-options')).toBe('nosniff')
	})

	it('adds Referrer-Policy: strict-origin-when-cross-origin', async () => {
		const response = await handle({ event: make_event(), resolve: make_resolve() })
		expect(response.headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin')
	})

	it('adds Permissions-Policy restricting camera, microphone, geolocation, payment', async () => {
		const response = await handle({ event: make_event(), resolve: make_resolve() })
		const policy = response.headers.get('permissions-policy')
		expect(policy).toContain('camera=()')
		expect(policy).toContain('microphone=()')
		expect(policy).toContain('geolocation=()')
		expect(policy).toContain('payment=()')
	})

	it("adds Content-Security-Policy with default-src 'self'", async () => {
		const response = await handle({ event: make_event(), resolve: make_resolve() })
		const csp = response.headers.get('content-security-policy')
		expect(csp).toContain("default-src 'self'")
		expect(csp).toContain("object-src 'none'")
		expect(csp).toContain("frame-ancestors 'self'")
	})

	it('still injects app version via transformPageChunk', async () => {
		let captured_transform: ResolveOptions['transformPageChunk'] | undefined
		const resolve = vi.fn<ResolveFn>().mockImplementation((_event, opts) => {
			captured_transform = opts?.transformPageChunk
			return Promise.resolve(new Response(null, { status: 200 }))
		})
		await handle({ event: make_event(), resolve })
		const result = await captured_transform?.({ html: 'v__APP_VERSION__', done: true })
		expect(result).toBe(`v${version}`)
	})

	it('injects game-name placeholders via transformPageChunk', async () => {
		let captured_transform: ResolveOptions['transformPageChunk'] | undefined
		const resolve = vi.fn<ResolveFn>().mockImplementation((_event, opts) => {
			captured_transform = opts?.transformPageChunk
			return Promise.resolve(new Response(null, { status: 200 }))
		})
		await handle({ event: make_event(), resolve })
		const result = await captured_transform?.({
			html: '<title>__GAME_NAME_DISPLAY__</title><p>__GAME_NAME_UPPER__</p>',
			done: true,
		})
		expect(result).toBe(
			`<title>${game_config.GAME_NAME_DISPLAY}</title><p>${game_config.GAME_NAME_UPPER}</p>`,
		)
	})

	it(`returns ${PERMANENT_REDIRECT_STATUS} when hostname is the legacy domain`, async () => {
		const resolve = make_resolve()
		const response = await handle({
			event: make_event(`https://${LEGACY_HOSTNAME}/`),
			resolve,
		})
		expect(response.status).toBe(PERMANENT_REDIRECT_STATUS)
		expect(response.headers.get('location')).toBe(`https://${NEW_HOSTNAME}/`)
		expect(resolve).not.toHaveBeenCalled()
	})

	it('preserves path when redirecting from the legacy domain', async () => {
		const response = await handle({
			event: make_event(`https://${LEGACY_HOSTNAME}/some/deep/path`),
			resolve: make_resolve(),
		})
		expect(response.headers.get('location')).toBe(`https://${NEW_HOSTNAME}/some/deep/path`)
	})

	it('preserves query string when redirecting from the legacy domain', async () => {
		const response = await handle({
			event: make_event(`https://${LEGACY_HOSTNAME}/?foo=bar&baz=1`),
			resolve: make_resolve(),
		})
		expect(response.headers.get('location')).toBe(`https://${NEW_HOSTNAME}/?foo=bar&baz=1`)
	})

	it('does not redirect when hostname is the new domain', async () => {
		const resolve = make_resolve()
		const response = await handle({
			event: make_event(`https://${NEW_HOSTNAME}/`),
			resolve,
		})
		expect(response.status).toBe(200)
		expect(response.headers.get('location')).toBeNull()
		expect(resolve).toHaveBeenCalledTimes(1)
	})

	it('does not redirect when hostname is localhost (dev / preview)', async () => {
		const resolve = make_resolve()
		await handle({
			event: make_event('http://localhost:5173/'),
			resolve,
		})
		expect(resolve).toHaveBeenCalledTimes(1)
	})
})

describe('build_legacy_redirect', () => {
	it('returns a 301 response with Location pointing to the new hostname', () => {
		const response = build_legacy_redirect(new URL(`https://${LEGACY_HOSTNAME}/path?q=1`))
		expect(response.status).toBe(PERMANENT_REDIRECT_STATUS)
		expect(response.headers.get('location')).toBe(`https://${NEW_HOSTNAME}/path?q=1`)
	})

	it('does not include a body', async () => {
		const response = build_legacy_redirect(new URL(`https://${LEGACY_HOSTNAME}/`))
		expect(await response.text()).toBe('')
	})
})
