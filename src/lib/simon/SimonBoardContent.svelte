<script lang="ts">
	import { T } from '@threlte/core'
	import { Text } from '@threlte/extras'
	import { fonts } from '$lib/game/fonts'
	import { BOARD_LABEL_Z } from './board-config'
	import {
		BACKING_RADIUS,
		BACKING_SEGMENTS,
		BACKING_Z,
		btn_dim_color,
		btn_lit_color,
		BUTTON_CONFIGS,
		CENTER_RADIUS,
		CIRCLE_SEGMENTS,
		CYBER_EMISSIVE_INTENSITY,
		EMISSIVE_INTENSITY,
		FONT_SIZE,
		INNER_RADIUS,
		OUTER_RADIUS,
		THETA_LENGTH,
		THETA_SEGMENTS,
		THETA_START,
	} from './simon-button-config'
	import type { ButtonColor } from './types'

	type PointerDownEvent = { nativeEvent: { button: number } }

	interface Props {
		is_alt: boolean
		flash_intensity: number
		center_text: string
		is_color_lit: (color: ButtonColor) => boolean
		on_button_pointer_down: (e: PointerDownEvent, color: ButtonColor) => void
		on_button_release: () => void
		on_center_click: () => void
	}

	let {
		is_alt,
		flash_intensity,
		center_text,
		is_color_lit,
		on_button_pointer_down,
		on_button_release,
		on_center_click,
	}: Props = $props()

	let emissive_intensity = $derived(
		(is_alt ? CYBER_EMISSIVE_INTENSITY : EMISSIVE_INTENSITY) * flash_intensity,
	)
	let current_font = $derived(fonts.get_font(is_alt))
	let current_font_size = $derived(FONT_SIZE * fonts.get_font_size_multiplier(is_alt))
</script>

<T.Mesh position.z={BACKING_Z}>
	<T.CircleGeometry args={[BACKING_RADIUS, BACKING_SEGMENTS]} />
	<T.MeshStandardMaterial color="#111111" roughness={0.8} />
</T.Mesh>

{#each BUTTON_CONFIGS as btn (btn.color)}
	<T.Group rotation.z={btn.rotation}>
		<T.Mesh
			onpointerdown={(e: PointerDownEvent) => on_button_pointer_down(e, btn.color)}
			onpointerup={on_button_release}
			onpointerleave={on_button_release}
		>
			<T.RingGeometry
				args={[INNER_RADIUS, OUTER_RADIUS, THETA_SEGMENTS, 1, THETA_START, THETA_LENGTH]}
			/>
			{@const lit = btn_lit_color(btn, is_alt)}
			{@const dim = btn_dim_color(btn, is_alt)}
			{@const active = is_color_lit(btn.color)}
			<T.MeshStandardMaterial
				color={active ? lit : dim}
				emissive={active ? lit : '#000000'}
				emissiveIntensity={emissive_intensity}
			/>
		</T.Mesh>
	</T.Group>
{/each}

<T.Mesh onclick={on_center_click}>
	<T.CircleGeometry args={[CENTER_RADIUS, CIRCLE_SEGMENTS]} />
	<T.MeshStandardMaterial color="#222222" roughness={0.5} />
</T.Mesh>

<T.Group position={[0, 0, BOARD_LABEL_Z]}>
	<Text
		text={center_text}
		font={current_font}
		fontSize={current_font_size}
		color="#ffffff"
		anchorX="center"
		anchorY="middle"
	/>
</T.Group>
