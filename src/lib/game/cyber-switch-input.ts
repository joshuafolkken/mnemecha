import { create_switch_input } from '$lib/game/switch-input';

type CyberSwitchCallbacks = {
	on_toggle: () => void;
};

let cyber_callbacks: CyberSwitchCallbacks = { on_toggle: () => {} };

function configure(cbs: CyberSwitchCallbacks): void {
	cyber_callbacks = cbs;
}

const { on_click } = create_switch_input({ action: () => cyber_callbacks.on_toggle() });

export const cyber_switch_input = { configure, on_click };
