import { create_sveltekit_config } from '@joshuafolkken/kit/eslint/sveltekit'
import svelteConfig from './svelte.config.js'

const GAME_COMPLEXITY = 7
const GAME_FN_LINES = 50
const GAME_FN_STATEMENTS = 20
const GAME_FILE_LINES = 400

function lines_cap(max) {
	return ['error', { max, skipBlankLines: true, skipComments: true }]
}

// Game/Three.js/Web-Audio code uses null contracts and definition-site exports, and runs longer and
// more-branchy than UI glue. Relax these for src/lib/game/** only; the rest of the app stays strict.
const game_overrides = {
	files: ['src/lib/game/**'],
	rules: {
		'unicorn/no-null': 'off',
		'import/exports-last': 'off',
		'max-lines-per-function': lines_cap(GAME_FN_LINES),
		'max-statements': ['error', GAME_FN_STATEMENTS],
		'max-lines': lines_cap(GAME_FILE_LINES),
		complexity: ['error', GAME_COMPLEXITY],
		'sonarjs/cognitive-complexity': ['error', GAME_COMPLEXITY],
	},
}

export default create_sveltekit_config({
	gitignore_path: new URL('./.gitignore', import.meta.url),
	tsconfig_root_dir: import.meta.dirname,
	svelte_config: svelteConfig,
}).concat(game_overrides)
