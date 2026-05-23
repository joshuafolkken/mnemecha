import { describe, expect, it } from 'vitest'
import { base_messages, messages, simon_messages } from './en'

const SIMON_SPECIFIC_KEYS = [
	'game_title',
	'simon_start',
	'simon_gameover',
	'game_application_label',
] as const

const EXPECTED_GAME_TITLE = 'MNEMECHA'
const EXPECTED_GAME_APPLICATION_LABEL = 'Mnemecha'

describe('messages', () => {
	it('contains all original keys for backward compatibility', () => {
		const original_keys = [
			'game_title',
			'cyber_switch_label',
			'click_to_start',
			'tap_to_start',
			'simon_start',
			'simon_gameover',
			'jump_button',
			'loading_downloading',
			'loading_initializing',
			'loading_loading_assets',
			'loading_ready',
			'score_high_score',
			'score_current',
			'score_round',
			'game_application_label',
			'game_started_announcement',
			'pause_button',
		]
		for (const key of original_keys) {
			expect(messages).toHaveProperty(key)
		}
	})

	it('no longer exposes simon_round (board center label renders the round digit only)', () => {
		expect(messages).not.toHaveProperty('simon_round')
	})
})

describe('base_messages', () => {
	it('contains no simon-specific keys', () => {
		for (const key of SIMON_SPECIFIC_KEYS) {
			expect(base_messages).not.toHaveProperty(key)
		}
	})
})

describe('simon_messages', () => {
	it('contains all simon-specific keys', () => {
		for (const key of SIMON_SPECIFIC_KEYS) {
			expect(simon_messages).toHaveProperty(key)
		}
	})

	it('exposes the Mnemecha brand as game_title', () => {
		expect(simon_messages.game_title).toBe(EXPECTED_GAME_TITLE)
	})

	it('exposes the Mnemecha brand as game_application_label', () => {
		expect(simon_messages.game_application_label).toBe(EXPECTED_GAME_APPLICATION_LABEL)
	})
})
