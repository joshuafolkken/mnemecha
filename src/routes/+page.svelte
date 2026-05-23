<script lang="ts">
	import { device, GameScene } from '@joshuafolkken/game-kit'
	import { simon_board_input } from '$lib/game/board-input'
	import { simon } from '$lib/game/game.svelte'
	import { hard_simon_board_input } from '$lib/game/hard-board-input'
	import { hard_simon } from '$lib/game/hard.svelte'
	import SimonScene from '$lib/game/Scene.svelte'
	import { messages } from '$lib/messages'

	simon_board_input.configure({
		on_press: (color) => simon.press(color),
		on_release: () => simon.release(),
		on_start: () => simon.start(),
	})
	hard_simon_board_input.configure({
		on_press: (item) => hard_simon.press(item),
		on_release: () => hard_simon.release(),
		on_start: () => hard_simon.start(),
	})

	let hint_text = $derived(
		device.is_touch_primary ? messages.tap_to_start : messages.click_to_start,
	)
</script>

<GameScene
	{hint_text}
	label_jump={messages.jump_button}
	label_game={messages.game_application_label}
	label_game_started={messages.game_started_announcement}
	label_pause={messages.pause_button}
>
	<SimonScene />
</GameScene>
