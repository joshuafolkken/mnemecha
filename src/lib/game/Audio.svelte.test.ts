import { audio as game_audio } from '@joshuafolkken/game-kit'
import { simon_audio } from '$lib/game/audio'
import type { ButtonColor } from '$lib/game/types'
import { afterEach, describe, expect, it, vi } from 'vitest'

const ALL_COLORS: Array<ButtonColor> = ['green', 'red', 'yellow', 'blue']

interface MockGainNode {
	gain: {
		setValueAtTime: ReturnType<typeof vi.fn>
		exponentialRampToValueAtTime: ReturnType<typeof vi.fn>
	}
	connect: ReturnType<typeof vi.fn>
}

interface MockOscNode {
	connect: ReturnType<typeof vi.fn>
	frequency: { setValueAtTime: ReturnType<typeof vi.fn> }
	type: OscillatorType
	start: ReturnType<typeof vi.fn>
	stop: ReturnType<typeof vi.fn>
}

interface MockContext {
	ctx: AudioContext
	gain_node: MockGainNode
	osc_node: MockOscNode
}

function make_mock_ctx(): MockContext {
	const gain_node = {
		gain: {
			setValueAtTime: vi.fn(),
			exponentialRampToValueAtTime: vi.fn(),
		},
		connect: vi.fn(),
	}
	const osc_node = {
		connect: vi.fn(),
		frequency: { setValueAtTime: vi.fn() },
		type: '' as OscillatorType,
		start: vi.fn(),
		stop: vi.fn(),
	}
	const ctx = {
		createOscillator: vi.fn().mockReturnValue(osc_node),
		createGain: vi.fn().mockReturnValue(gain_node),
		destination: {},
		currentTime: 0,
	} as unknown as AudioContext

	return { ctx, gain_node, osc_node }
}

describe('simon audio', () => {
	it.each(ALL_COLORS)('play_tone does not throw for %s', (color) => {
		expect(() => {
			simon_audio.play_tone(color, 100, false)
		}).not.toThrow()
	})

	it('play_error_tone does not throw', () => {
		expect(() => {
			simon_audio.play_error_tone(100, false)
		}).not.toThrow()
	})

	it.each(ALL_COLORS)('start_tone does not throw for %s', (color) => {
		expect(() => {
			simon_audio.start_tone(color, false)
		}).not.toThrow()
	})

	it('stop_tone does not throw when no tone is playing', () => {
		expect(() => {
			simon_audio.stop_tone()
		}).not.toThrow()
	})
})

describe('simon audio cyber mode', () => {
	it.each(ALL_COLORS)('play_tone does not throw for %s in cyber mode', (color) => {
		expect(() => {
			simon_audio.play_tone(color, 100, true)
		}).not.toThrow()
	})
})

function setup_audio_environment(): MockContext {
	const mock = make_mock_ctx()

	vi.spyOn(game_audio, 'init_audio').mockImplementation(() => {
		/* no-op */
	})
	vi.spyOn(game_audio, 'get_audio_context').mockReturnValue(mock.ctx)

	return mock
}

describe('simon audio envelope', () => {
	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('normal mode uses flat envelope — no exponential ramp', () => {
		const { gain_node } = setup_audio_environment()

		simon_audio.play_tone('green', 200, false)

		expect(gain_node.gain.setValueAtTime).toHaveBeenCalled()
		expect(gain_node.gain.exponentialRampToValueAtTime).not.toHaveBeenCalled()
	})

	it('cyber mode applies exponential gain ramp', () => {
		const { gain_node } = setup_audio_environment()

		simon_audio.play_tone('green', 200, true)

		expect(gain_node.gain.exponentialRampToValueAtTime).toHaveBeenCalled()
	})

	it('play_error_tone uses ERROR_FREQ', () => {
		const { osc_node } = setup_audio_environment()

		simon_audio.play_error_tone(3000, false)

		expect(osc_node.frequency.setValueAtTime).toHaveBeenCalledWith(simon_audio.ERROR_FREQ, 0)
	})

	it('start_tone starts oscillator without calling stop', () => {
		const { osc_node } = setup_audio_environment()

		simon_audio.start_tone('green', false)

		expect(osc_node.start).toHaveBeenCalled()
		expect(osc_node.stop).not.toHaveBeenCalled()
	})

	it('stop_tone calls stop on the active oscillator', () => {
		const { osc_node } = setup_audio_environment()

		simon_audio.start_tone('red', false)
		simon_audio.stop_tone()

		expect(osc_node.stop).toHaveBeenCalledTimes(1)
	})

	it('play_error_tone normal mode uses flat envelope', () => {
		const { gain_node } = setup_audio_environment()

		simon_audio.play_error_tone(3000, false)

		expect(gain_node.gain.setValueAtTime).toHaveBeenCalled()
		expect(gain_node.gain.exponentialRampToValueAtTime).not.toHaveBeenCalled()
	})

	it('play_error_tone cyber mode applies exponential gain ramp', () => {
		const { gain_node } = setup_audio_environment()

		simon_audio.play_error_tone(3000, true)

		expect(gain_node.gain.exponentialRampToValueAtTime).toHaveBeenCalled()
	})
})
