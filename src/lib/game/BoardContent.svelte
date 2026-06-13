<script lang="ts">
	import { fonts } from '@joshuafolkken/game-kit'
	import { T } from '@threlte/core'
	import { Text } from '@threlte/extras'
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
		INNER_RADIUS,
		OUTER_RADIUS,
		SINGLE_LINE_HEIGHT,
		THETA_LENGTH,
		THETA_SEGMENTS,
		THETA_START,
	} from './button-config'
	import type { ButtonColor } from './types'

	interface PointerDownEvent {
		nativeEvent: { button: number }
	}

	const BACKING_ROUGHNESS = 0.8
	const CENTER_ROUGHNESS = 0.5

	interface Props {
		is_alt: boolean
		flash_intensity: number
		center_text: string
		base_font_size: number
		line_height?: number
		is_color_lit: (color: ButtonColor) => boolean
		on_button_pointer_down: (e: PointerDownEvent, color: ButtonColor) => void
		on_button_release: () => void
		on_center_click: () => void
	}

	const {
		is_alt,
		flash_intensity,
		center_text,
		base_font_size,
		line_height = SINGLE_LINE_HEIGHT,
		is_color_lit,
		on_button_pointer_down,
		on_button_release,
		on_center_click,
	}: Props = $props()

	const emissive_intensity = $derived(
		(is_alt ? CYBER_EMISSIVE_INTENSITY : EMISSIVE_INTENSITY) * flash_intensity,
	)
	const current_font = $derived(fonts.get_active_font())
	const current_font_size = $derived(base_font_size * fonts.get_active_font_size_multiplier())
</script>

<T.Mesh position.z={BACKING_Z}>
	<T.CircleGeometry args={[BACKING_RADIUS, BACKING_SEGMENTS]} />
	<T.MeshStandardMaterial color="#111111" roughness={BACKING_ROUGHNESS} />
</T.Mesh>

{#each BUTTON_CONFIGS as btn (btn.color)}
	<T.Group rotation.z={btn.rotation}>
		<T.Mesh
			onpointerdown={(e: PointerDownEvent) => {
				on_button_pointer_down(e, btn.color)
			}}
			onpointerup={on_button_release}
			onpointerleave={on_button_release}
		>
			<T.RingGeometry
				args={[INNER_RADIUS, OUTER_RADIUS, THETA_SEGMENTS, 1, THETA_START, THETA_LENGTH]}
			/>
			{@const lit = btn_lit_color(btn, is_alt)}
			{@const dim = btn_dim_color(btn, is_alt)}
			{@const is_active = is_color_lit(btn.color)}
			<T.MeshStandardMaterial
				color={is_active ? lit : dim}
				emissive={is_active ? lit : '#000000'}
				emissiveIntensity={emissive_intensity}
			/>
		</T.Mesh>
	</T.Group>
{/each}

<T.Mesh onclick={on_center_click}>
	<T.CircleGeometry args={[CENTER_RADIUS, CIRCLE_SEGMENTS]} />
	<T.MeshStandardMaterial color="#222222" roughness={CENTER_ROUGHNESS} />
</T.Mesh>

<T.Group position={[0, 0, BOARD_LABEL_Z]}>
	<Text
		text={center_text}
		font={current_font}
		fontSize={current_font_size}
		lineHeight={line_height}
		color="#ffffff"
		anchorX="center"
		anchorY="middle"
	/>
</T.Group>
