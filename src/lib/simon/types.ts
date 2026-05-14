export type ButtonColor = 'green' | 'red' | 'yellow' | 'blue'

export interface SimonBoardData {
	active_color: ButtonColor | null
	pressed_color: ButtonColor | null
	phase: string
	round: number
	flash_colors: readonly ButtonColor[]
	flash_intensity: number
}

export type SimonPhase = 'idle' | 'showing' | 'player_input' | 'round_complete' | 'gameover'

export type HardBoardIndex = 0 | 1 | 2

export interface HardSequenceItem {
	board_index: HardBoardIndex
	color: ButtonColor
}

export interface HardSimonBoardData {
	active_item: HardSequenceItem | null
	pressed_item: HardSequenceItem | null
	phase: string
	round: number
	flash_colors: readonly ButtonColor[]
	flash_intensity: number
}
