export const base_messages = {
	cyber_switch_label: 'CYBER',
	click_to_start: 'CLICK TO START',
	tap_to_start: 'TAP TO START',
	jump_button: 'JUMP',
	loading_downloading: 'DOWNLOADING...',
	loading_initializing: 'INITIALIZING...',
	loading_loading_assets: 'LOADING ASSETS...',
	loading_ready: 'READY',
	score_high_score: 'HI',
	score_current: 'SCORE',
	score_round: 'RND',
	game_started_announcement: 'Game started',
	pause_button: 'Pause',
} as const

export const simon_messages = {
	game_title: 'MNEMECHA',
	simon_start: 'START',
	simon_round: 'ROUND',
	simon_gameover: 'GAME OVER',
	game_application_label: 'Mnemecha',
} as const

export const messages = { ...base_messages, ...simon_messages } as const
