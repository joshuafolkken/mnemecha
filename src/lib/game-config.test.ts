import { describe, expect, it } from 'vitest'
import { game_config } from './game-config'

describe('game_config', () => {
	it('uses the kebab-case project name as GAME_NAME', () => {
		expect(game_config.GAME_NAME).toBe('mnemecha')
	})

	it('uses the title-case brand as GAME_NAME_DISPLAY', () => {
		expect(game_config.GAME_NAME_DISPLAY).toBe('Mnemecha')
	})

	it('uses the upper-case brand as GAME_NAME_UPPER', () => {
		expect(game_config.GAME_NAME_UPPER).toBe('MNEMECHA')
	})

	it('describes the game', () => {
		expect(game_config.GAME_DESCRIPTION).toBe('A Mnemecha game')
	})

	it('exposes a human-readable app label', () => {
		expect(game_config.GAME_APP_LABEL).toBe('Mnemecha')
	})
})
