<script lang="ts">
	import GameScene from '$lib/game/GameScene.svelte';
	import SimonScene from '$lib/simon/SimonScene.svelte';
	import { simon_board_input } from '$lib/simon/simon-board-input';
	import { simon } from '$lib/simon/simon.svelte';
	import { messages } from '$lib/messages/en';

	simon_board_input.configure({
		on_press: (color) => simon.press(color),
		on_release: () => simon.release(),
		on_start: () => simon.start()
	});
</script>

<GameScene
	hint_text={messages.click_to_play}
	label_jump={messages.jump_button}
	label_game={messages.game_application_label}
	label_game_started={messages.game_started_announcement}
>
	<SimonScene />
</GameScene>
