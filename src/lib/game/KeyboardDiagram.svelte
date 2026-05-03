<script lang="ts">
	interface Props {
		label_move: string;
		label_jump: string;
		label_return: string;
	}

	let { label_move, label_jump, label_return }: Props = $props();
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	viewBox="0 0 148 176"
	aria-label={label_move}
	role="img"
	class="keyboard-diagram"
	fill="none"
>
	<!-- W key -->
	<g class="key key-w" aria-hidden="true">
		<rect
			x="54"
			y="2"
			width="40"
			height="32"
			rx="5"
			fill="rgba(120,80,255,0.15)"
			stroke="rgba(160,120,255,0.8)"
			stroke-width="1.5"
		/>
		<text
			x="74"
			y="18"
			text-anchor="middle"
			dominant-baseline="central"
			fill="rgba(200,180,255,0.95)"
			font-size="13"
			font-family="Orbitron, monospace"
			font-weight="bold">W</text
		>
	</g>
	<!-- A key -->
	<g class="key key-a" aria-hidden="true">
		<rect
			x="2"
			y="46"
			width="40"
			height="32"
			rx="5"
			fill="rgba(120,80,255,0.15)"
			stroke="rgba(160,120,255,0.8)"
			stroke-width="1.5"
		/>
		<text
			x="22"
			y="62"
			text-anchor="middle"
			dominant-baseline="central"
			fill="rgba(200,180,255,0.95)"
			font-size="13"
			font-family="Orbitron, monospace"
			font-weight="bold">A</text
		>
	</g>
	<!-- S key -->
	<g class="key key-s" aria-hidden="true">
		<rect
			x="54"
			y="46"
			width="40"
			height="32"
			rx="5"
			fill="rgba(120,80,255,0.15)"
			stroke="rgba(160,120,255,0.8)"
			stroke-width="1.5"
		/>
		<text
			x="74"
			y="62"
			text-anchor="middle"
			dominant-baseline="central"
			fill="rgba(200,180,255,0.95)"
			font-size="13"
			font-family="Orbitron, monospace"
			font-weight="bold">S</text
		>
	</g>
	<!-- D key -->
	<g class="key key-d" aria-hidden="true">
		<rect
			x="106"
			y="46"
			width="40"
			height="32"
			rx="5"
			fill="rgba(120,80,255,0.15)"
			stroke="rgba(160,120,255,0.8)"
			stroke-width="1.5"
		/>
		<text
			x="126"
			y="62"
			text-anchor="middle"
			dominant-baseline="central"
			fill="rgba(200,180,255,0.95)"
			font-size="13"
			font-family="Orbitron, monospace"
			font-weight="bold">D</text
		>
	</g>
	<!-- Space bar -->
	<g class="key key-space" aria-hidden="true" aria-label={label_jump}>
		<rect
			x="2"
			y="110"
			width="144"
			height="28"
			rx="5"
			fill="rgba(120,80,255,0.15)"
			stroke="rgba(160,120,255,0.8)"
			stroke-width="1.5"
		/>
		<!-- Double chevron in space bar (matches Jump C, scaled 0.6 to text size) -->
		<polyline
			points="67,130 74,123 81,130"
			stroke="rgba(200,180,255,0.9)"
			stroke-width="1.5"
			stroke-linecap="round"
			stroke-linejoin="round"
			fill="none"
		/>
		<polyline
			class="space-chevron-top"
			points="67,125 74,118 81,125"
			stroke="rgba(200,180,255,0.9)"
			stroke-width="1.2"
			stroke-linecap="round"
			stroke-linejoin="round"
			fill="none"
			opacity="0.55"
		/>
	</g>
	<!-- ESC key -->
	<g class="key key-esc" aria-hidden="true" aria-label={label_return}>
		<rect
			x="2"
			y="150"
			width="56"
			height="24"
			rx="5"
			fill="rgba(80,60,160,0.1)"
			stroke="rgba(120,100,200,0.5)"
			stroke-width="1.5"
		/>
		<text
			x="30"
			y="162"
			text-anchor="middle"
			dominant-baseline="central"
			fill="rgba(160,140,220,0.7)"
			font-size="9"
			font-family="Orbitron, monospace"
			font-weight="bold">ESC</text
		>
	</g>
	<!-- Z key -->
	<g class="key key-z" aria-hidden="true" aria-label={label_return}>
		<rect
			x="90"
			y="150"
			width="56"
			height="24"
			rx="5"
			fill="rgba(80,60,160,0.1)"
			stroke="rgba(120,100,200,0.5)"
			stroke-width="1.5"
		/>
		<text
			x="118"
			y="162"
			text-anchor="middle"
			dominant-baseline="central"
			fill="rgba(160,140,220,0.7)"
			font-size="13"
			font-family="Orbitron, monospace"
			font-weight="bold">Z</text
		>
	</g>
	<!-- slash separator between ESC and Z -->
	<text
		x="74"
		y="162"
		text-anchor="middle"
		dominant-baseline="central"
		fill="rgba(120,100,200,0.5)"
		font-size="11"
		font-family="Orbitron, monospace">/</text
	>
</svg>

<style>
	.keyboard-diagram {
		height: min(40vh, 440px, 56vw);
		width: auto;
	}

	.key-w {
		animation: key-press 3.2s 0s ease-in-out infinite;
	}
	.key-a {
		animation: key-press 3.2s 0.8s ease-in-out infinite;
	}
	.key-s {
		animation: key-press 3.2s 1.6s ease-in-out infinite;
	}
	.key-d {
		animation: key-press 3.2s 2.4s ease-in-out infinite;
	}
	.key-space {
		animation: key-pulse 2.8s 0.4s ease-in-out infinite;
	}

	.space-chevron-top {
		animation: chevron-rise 1.6s ease-in-out infinite;
	}

	@keyframes chevron-rise {
		0%,
		100% {
			opacity: 0.55;
			transform: translateY(0);
		}
		50% {
			opacity: 0.9;
			transform: translateY(-2px);
		}
	}

	@keyframes key-press {
		0%,
		15%,
		40%,
		100% {
			opacity: 0.7;
		}
		25% {
			opacity: 1;
			filter: drop-shadow(0 0 5px rgba(160, 120, 255, 0.8));
		}
	}

	@keyframes key-pulse {
		0%,
		100% {
			opacity: 0.7;
		}
		50% {
			opacity: 1;
			filter: drop-shadow(0 0 4px rgba(160, 120, 255, 0.6));
		}
	}
</style>
