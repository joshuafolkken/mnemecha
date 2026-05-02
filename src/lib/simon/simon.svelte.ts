import { simon_audio } from './audio';
import { score as default_score, type ScoreInstance } from './score.svelte';
import { game_state } from '$lib/game/state.svelte';
import type { ButtonColor, SimonPhase } from './types';

const COLORS: readonly ButtonColor[] = ['green', 'red', 'yellow', 'blue'];
export const STEP_MS_1_5 = 500;
export const STEP_MS_6_13 = 400;
export const STEP_MS_14_20 = 250;
export const STEP_MS_21_PLUS = 150;
export const ON_RATIO = 0.7;
export const OFF_RATIO = 0.3;
export const ERROR_BEEP_MS = 3000;
export const RESTART_DELAY_MS = 1000;
export const FLASH_BURST_ON_MS = 30;
export const FLASH_BURST_OFF_MS = 20;
export const FLASH_BURST_CYCLES = 4;
export const FLASH_CASCADE_FWD_MS = 65;
export const FLASH_CASCADE_REV_MS = 40;
export const FLASH_FINALE_MS = 320;

const FLASH_INTENSITY_BURST = 2.5;
const FLASH_INTENSITY_FINALE = 4;

type SimonState = {
	phase: SimonPhase;
	sequence: ButtonColor[];
	position: number;
	active_color: ButtonColor | null;
	pressed_color: ButtonColor | null;
	round: number;
	flash_colors: ButtonColor[];
	flash_intensity: number;
};
type SimonTimers = {
	show_gen: number;
	flash_gen: number;
	restart_timer: ReturnType<typeof setTimeout> | null;
	input_start_ms: number;
};

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function get_step_ms(len: number): number {
	if (len <= 5) return STEP_MS_1_5;
	if (len <= 13) return STEP_MS_6_13;
	if (len <= 20) return STEP_MS_14_20;
	return STEP_MS_21_PLUS;
}

const FALLBACK_COLOR: ButtonColor = 'green';

function add_to_sequence(s: SimonState): void {
	const index = Math.floor(Math.random() * COLORS.length);
	s.sequence.push(COLORS[index] ?? FALLBACK_COLOR);
}

function cancel_restart_timer(t: SimonTimers): void {
	if (t.restart_timer !== null) clearTimeout(t.restart_timer);
	t.restart_timer = null;
}

function cancel_flash(s: SimonState, t: SimonTimers): void {
	t.flash_gen += 1;
	s.flash_colors = [];
	s.flash_intensity = 1;
}

function play_all_tones(duration_ms: number, is_alt: boolean): void {
	for (const color of COLORS) simon_audio.play_tone(color, duration_ms, is_alt);
}

async function run_show(s: SimonState, t: SimonTimers, gen: number): Promise<void> {
	const step_ms = get_step_ms(s.sequence.length);
	const on_ms = step_ms * ON_RATIO;
	const off_ms = step_ms * OFF_RATIO;
	for (const color of s.sequence) {
		if (gen !== t.show_gen) return;
		s.active_color = color;
		simon_audio.play_tone(color, on_ms, game_state.is_alt);
		await delay(on_ms);
		if (gen !== t.show_gen) return;
		s.active_color = null;
		await delay(off_ms);
	}
	if (gen !== t.show_gen) return;
	t.input_start_ms = Date.now();
	s.phase = 'player_input';
	s.position = 0;
}

async function flash_burst(s: SimonState, t: SimonTimers, gen: number): Promise<void> {
	for (let i = 0; i < FLASH_BURST_CYCLES; i++) {
		if (t.flash_gen !== gen) return;
		s.flash_colors = [...COLORS];
		s.flash_intensity = FLASH_INTENSITY_BURST;
		play_all_tones(FLASH_BURST_ON_MS, game_state.is_alt);
		await delay(FLASH_BURST_ON_MS);
		if (t.flash_gen !== gen) return;
		s.flash_colors = [];
		s.flash_intensity = 1;
		await delay(FLASH_BURST_OFF_MS);
	}
}

async function flash_cascade(s: SimonState, t: SimonTimers, gen: number): Promise<void> {
	for (const color of COLORS) {
		if (t.flash_gen !== gen) return;
		s.flash_colors = [color];
		s.flash_intensity = FLASH_INTENSITY_BURST;
		simon_audio.play_tone(color, FLASH_CASCADE_FWD_MS, game_state.is_alt);
		await delay(FLASH_CASCADE_FWD_MS);
	}
	for (const color of [...COLORS].reverse()) {
		if (t.flash_gen !== gen) return;
		s.flash_colors = [color];
		s.flash_intensity = FLASH_INTENSITY_BURST;
		simon_audio.play_tone(color, FLASH_CASCADE_REV_MS, game_state.is_alt);
		await delay(FLASH_CASCADE_REV_MS);
	}
}

async function flash_finale(s: SimonState, t: SimonTimers, gen: number): Promise<void> {
	if (t.flash_gen !== gen) return;
	s.flash_colors = [...COLORS];
	s.flash_intensity = FLASH_INTENSITY_FINALE;
	play_all_tones(FLASH_FINALE_MS, game_state.is_alt);
	await delay(FLASH_FINALE_MS);
	if (t.flash_gen !== gen) return;
	s.flash_colors = [];
	s.flash_intensity = 1;
}

async function run_victory_flash(s: SimonState, t: SimonTimers, gen: number): Promise<void> {
	await flash_burst(s, t, gen);
	await flash_cascade(s, t, gen);
	await flash_finale(s, t, gen);
}

function start_next_round(s: SimonState, t: SimonTimers): void {
	t.restart_timer = null;
	cancel_flash(s, t);
	s.round += 1;
	add_to_sequence(s);
	t.show_gen += 1;
	void run_show(s, t, t.show_gen);
}

function schedule_next_round(s: SimonState, t: SimonTimers): void {
	cancel_restart_timer(t);
	cancel_flash(s, t);
	s.phase = 'showing';
	void run_victory_flash(s, t, t.flash_gen);
	t.restart_timer = setTimeout(() => start_next_round(s, t), RESTART_DELAY_MS);
}

function handle_correct_press(s: SimonState, t: SimonTimers, score: ScoreInstance): void {
	s.position += 1;
	if (s.position < s.sequence.length) return;
	score.add_round_score(Date.now() - t.input_start_ms, s.sequence.length, s.round);
	s.phase = 'round_complete';
}

function start_simon(s: SimonState, t: SimonTimers, score: ScoreInstance): void {
	if (s.phase === 'showing' || s.phase === 'player_input') return;
	cancel_restart_timer(t);
	score.reset();
	s.phase = 'showing';
	s.round = 1;
	s.sequence = [];
	add_to_sequence(s);
	t.show_gen += 1;
	void run_show(s, t, t.show_gen);
}

function release_simon(s: SimonState, t: SimonTimers): void {
	simon_audio.stop_tone();
	s.pressed_color = null;
	if (s.phase === 'round_complete') schedule_next_round(s, t);
}

function press_simon(
	s: SimonState,
	t: SimonTimers,
	score: ScoreInstance,
	color: ButtonColor
): void {
	if (s.phase !== 'player_input') return;
	s.pressed_color = color;
	simon_audio.start_tone(color, game_state.is_alt);
	if (color === s.sequence[s.position]) {
		handle_correct_press(s, t, score);
	} else {
		simon_audio.play_error_tone(ERROR_BEEP_MS, game_state.is_alt);
		s.phase = 'gameover';
	}
}

function reset_simon(s: SimonState, t: SimonTimers, score: ScoreInstance): void {
	t.show_gen += 1;
	release_simon(s, t);
	cancel_restart_timer(t);
	cancel_flash(s, t);
	score.reset();
	s.phase = 'idle';
	s.sequence = [];
	s.position = 0;
	s.active_color = null;
	t.input_start_ms = 0;
	s.round = 0;
}

function make_simon_api(s: SimonState, t: SimonTimers, score: ScoreInstance) {
	return {
		get phase() {
			return s.phase;
		},
		get sequence() {
			return s.sequence;
		},
		get position() {
			return s.position;
		},
		get active_color() {
			return s.active_color;
		},
		get pressed_color() {
			return s.pressed_color;
		},
		get round() {
			return s.round;
		},
		get flash_colors() {
			return s.flash_colors;
		},
		get flash_intensity() {
			return s.flash_intensity;
		},
		start: (): void => start_simon(s, t, score),
		press: (color: ButtonColor): void => press_simon(s, t, score, color),
		release: (): void => release_simon(s, t),
		reset: (): void => reset_simon(s, t, score)
	};
}

export function create_simon(score: ScoreInstance) {
	const s = $state<SimonState>({
		phase: 'idle',
		sequence: [],
		position: 0,
		active_color: null,
		pressed_color: null,
		round: 0,
		flash_colors: [],
		flash_intensity: 1
	});
	const t: SimonTimers = { show_gen: 0, flash_gen: 0, restart_timer: null, input_start_ms: 0 };
	return make_simon_api(s, t, score);
}

export type SimonInstance = ReturnType<typeof create_simon>;

export const simon = create_simon(default_score);
