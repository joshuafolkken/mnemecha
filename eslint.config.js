import { create_game_config } from '@joshuafolkken/game-kit/eslint/game'
import svelteConfig from './svelte.config.js'

export default create_game_config({
	gitignore_path: new URL('./.gitignore', import.meta.url),
	tsconfig_root_dir: import.meta.dirname,
	svelte_config: svelteConfig,
})
