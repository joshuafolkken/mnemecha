const BASE_SCORE = 1000
const TIME_COEFF_DECAY = 0.1
const MIN_TIME_COEFF = 0.1
const CHECK_SEED = 0x9e_37_79_b9
const MS_PER_SECOND = 1000
const SCORE_FORMATTER = new Intl.NumberFormat('en-US')

export const MNEMECHA_SCORE_KEY_PREFIX = 'mnemecha'
export const LEGACY_SCORE_KEY_PREFIX = 'simon'

const SCORE_KEY_SUFFIXES = ['_high_score', '_high_score_round', '_high_score_check'] as const

export interface StorageKeys {
	score: string
	round: string
	check: string
}

interface RoundData {
	elapsed_ms: number
	sequence_length: number
	round: number
}

function build_keys(prefix: string): StorageKeys {
	return {
		score: `${prefix}_high_score`,
		round: `${prefix}_high_score_round`,
		check: `${prefix}_high_score_check`,
	}
}

function has_legacy_key(legacy_prefix: string): boolean {
	return SCORE_KEY_SUFFIXES.some(
		(suffix) => localStorage.getItem(`${legacy_prefix}${suffix}`) !== null,
	)
}

function copy_legacy_to_new(legacy_prefix: string, new_prefix: string): void {
	for (const suffix of SCORE_KEY_SUFFIXES) {
		const value = localStorage.getItem(`${legacy_prefix}${suffix}`)
		if (value !== null) localStorage.setItem(`${new_prefix}${suffix}`, value)
	}
}

function remove_legacy_keys(legacy_prefix: string): void {
	for (const suffix of SCORE_KEY_SUFFIXES) {
		localStorage.removeItem(`${legacy_prefix}${suffix}`)
	}
}

function has_complete_keyset(keys: StorageKeys): boolean {
	return (
		localStorage.getItem(keys.score) !== null &&
		localStorage.getItem(keys.round) !== null &&
		localStorage.getItem(keys.check) !== null
	)
}

function run_migration(legacy_prefix: string, new_prefix: string): void {
	if (!has_legacy_key(legacy_prefix)) return
	const new_keys = build_keys(new_prefix)
	if (!has_complete_keyset(new_keys)) copy_legacy_to_new(legacy_prefix, new_prefix)
	if (has_complete_keyset(new_keys)) remove_legacy_keys(legacy_prefix)
}

function migrate_legacy_score_keys(legacy_prefix: string, new_prefix: string): void {
	if (legacy_prefix === new_prefix) return

	try {
		run_migration(legacy_prefix, new_prefix)
	} catch {
		// storage not available in this environment
	}
}

function compute_check(value: number, round: number): number {
	// eslint-disable-next-line no-bitwise -- bitwise hash mixing
	return (Math.imul(value + 1, CHECK_SEED) ^ Math.imul(round + 1, CHECK_SEED >>> 1)) >>> 0
}

function load_stored_data(keys: StorageKeys): { score: number; round: number } {
	try {
		const stored_score = Number(localStorage.getItem(keys.score))
		const stored_round = Number(localStorage.getItem(keys.round))
		const stored_check = Number(localStorage.getItem(keys.check))
		const is_valid_score = Number.isFinite(stored_score) && stored_score > 0
		const is_valid_round = Number.isFinite(stored_round) && stored_round >= 0
		const is_check_ok = compute_check(stored_score, stored_round) === stored_check
		if (!is_valid_score || !is_valid_round || !is_check_ok) return { score: 0, round: 0 }

		return { score: stored_score, round: stored_round }
	} catch {
		return { score: 0, round: 0 }
	}
}

function save_high_score(value: number, round: number, keys: StorageKeys): void {
	try {
		localStorage.setItem(keys.score, String(value))
		localStorage.setItem(keys.round, String(round))
		localStorage.setItem(keys.check, String(compute_check(value, round)))
	} catch {
		// storage not available in this environment
	}
}

function calculate_time_coefficient(elapsed_ms: number, sequence_length: number): number {
	const avg_s = elapsed_ms / MS_PER_SECOND / sequence_length

	return Math.max(MIN_TIME_COEFF, 1 - avg_s * TIME_COEFF_DECAY)
}

function calculate_round_score(elapsed_ms: number, sequence_length: number, round: number): number {
	return Math.round(BASE_SCORE * calculate_time_coefficient(elapsed_ms, sequence_length) * round)
}

function format_score(value: number): string {
	return SCORE_FORMATTER.format(value)
}

interface ScoreState {
	current_score: number
	high_score: number
	high_score_round: number
	is_new_high_score: boolean
	last_cleared_round: number
}

interface ScoreApi {
	readonly current_score: number
	readonly high_score: number
	readonly high_score_round: number
	readonly is_new_high_score: boolean
	readonly last_cleared_round: number
	add_round_score: (elapsed_ms: number, sequence_length: number, round: number) => void
	reset: () => void
	format_score: (value: number) => string
	calculate_time_coefficient: (elapsed_ms: number, sequence_length: number) => number
	calculate_round_score: (elapsed_ms: number, sequence_length: number, round: number) => number
}

function update_high_score(state: ScoreState, round: number, keys: StorageKeys): void {
	if (state.current_score <= state.high_score) return
	state.high_score = state.current_score
	state.high_score_round = round
	state.is_new_high_score = true
	save_high_score(state.high_score, round, keys)
}

function add_round_score_impl(state: ScoreState, data: RoundData, keys: StorageKeys): void {
	state.current_score += calculate_round_score(data.elapsed_ms, data.sequence_length, data.round)
	state.last_cleared_round = data.round
	update_high_score(state, data.round, keys)
}

function reset_score_impl(state: ScoreState): void {
	state.current_score = 0
	state.is_new_high_score = false
	state.last_cleared_round = 0
}

function make_score_api(state: ScoreState, keys: StorageKeys): ScoreApi {
	return {
		get current_score(): number {
			return state.current_score
		},
		get high_score(): number {
			return state.high_score
		},
		get high_score_round(): number {
			return state.high_score_round
		},
		get is_new_high_score(): boolean {
			return state.is_new_high_score
		},
		get last_cleared_round(): number {
			return state.last_cleared_round
		},
		add_round_score: (elapsed_ms: number, sequence_length: number, round: number): void => {
			add_round_score_impl(state, { elapsed_ms, sequence_length, round }, keys)
		},
		reset: (): void => {
			reset_score_impl(state)
		},
		format_score,
		calculate_time_coefficient,
		calculate_round_score,
	}
}

function create_score(
	key_prefix: string = MNEMECHA_SCORE_KEY_PREFIX,
	legacy_prefix?: string,
): ScoreApi {
	if (legacy_prefix !== undefined) migrate_legacy_score_keys(legacy_prefix, key_prefix)
	const keys = build_keys(key_prefix)
	const loaded = load_stored_data(keys)
	const state = $state<ScoreState>({
		current_score: 0,
		high_score: loaded.score,
		high_score_round: loaded.round,
		is_new_high_score: false,
		last_cleared_round: 0,
	})

	return make_score_api(state, keys)
}

export type ScoreInstance = ReturnType<typeof create_score>

const score = create_score(MNEMECHA_SCORE_KEY_PREFIX, LEGACY_SCORE_KEY_PREFIX)

export {
	migrate_legacy_score_keys,
	compute_check,
	load_stored_data,
	calculate_time_coefficient,
	calculate_round_score,
	format_score,
	create_score,
	score,
}
