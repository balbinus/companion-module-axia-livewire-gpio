import type { CompanionPresetDefinitions } from '@companion-module/base'
import { combineRgb } from '@companion-module/base'
import type { GpioModuleInstance } from './main.js'

function registerConsolePresets(self: GpioModuleInstance): void {
	const presets: CompanionPresetDefinitions = {}
	const defaultChannel = 1
	const pins = [1, 2, 3, 4, 5]

	for (const pin of pins) {
		// GPO Set High
		presets[`gpo_ch${defaultChannel}_pin${pin}_high`] = {
			type: 'button',
			category: `GPO Channel ${defaultChannel}`,
			name: `GPO ${pin} High`,
			style: {
				text: `GPO ${pin}\\nHIGH`,
				size: 'auto',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(0, 0, 0),
			},
			steps: [
				{
					down: [
						{
							actionId: 'gpo_set',
							options: { channel: defaultChannel, pin: String(pin), level: 'high' },
						},
					],
					up: [],
				},
			],
			feedbacks: [],
		}

		// GPO Set Low
		presets[`gpo_ch${defaultChannel}_pin${pin}_low`] = {
			type: 'button',
			category: `GPO Channel ${defaultChannel}`,
			name: `GPO ${pin} Low`,
			style: {
				text: `GPO ${pin}\\nLOW`,
				size: 'auto',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(0, 0, 0),
			},
			steps: [
				{
					down: [
						{
							actionId: 'gpo_set',
							options: { channel: defaultChannel, pin: String(pin), level: 'low' },
						},
					],
					up: [],
				},
			],
			feedbacks: [],
		}

		// GPO Momentary (high on press, low on release)
		presets[`gpo_ch${defaultChannel}_pin${pin}_momentary`] = {
			type: 'button',
			category: `GPO Channel ${defaultChannel}`,
			name: `GPO ${pin} Momentary`,
			style: {
				text: `GPO ${pin}\\nMOM`,
				size: 'auto',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(0, 0, 0),
			},
			steps: [
				{
					down: [
						{
							actionId: 'gpo_set',
							options: { channel: defaultChannel, pin: String(pin), level: 'low' },
						},
					],
					up: [
						{
							actionId: 'gpo_set',
							options: { channel: defaultChannel, pin: String(pin), level: 'high' },
						},
					],
				},
			],
			feedbacks: [],
		}

		// GPI Monitor (shows GPI state with feedback)
		presets[`gpi_ch${defaultChannel}_pin${pin}_monitor`] = {
			type: 'button',
			category: `GPI Channel ${defaultChannel}`,
			name: `GPI ${pin} Monitor`,
			style: {
				text: `GPI ${pin}\\n$(axia-livewire-gpio:gpi_${defaultChannel}_${pin}_level)`,
				size: 'auto',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(64, 64, 64),
			},
			steps: [{ down: [], up: [] }],
			feedbacks: [
				{
					feedbackId: 'gpi_state',
					options: {
						channel: defaultChannel,
						pin: String(pin),
						level: 'low',
					},
					style: {
						bgcolor: combineRgb(0, 255, 0),
						color: combineRgb(0, 0, 0),
					},
				},
			],
		}
	}

	self.setPresetDefinitions(presets)
}

function registerNodePresets(self: GpioModuleInstance): void {
	const presets: CompanionPresetDefinitions = {}
	const defaultChannel = 1
	const pins = [1, 2, 3, 4, 5]

	for (const pin of pins) {
		// GPI Assert High
		presets[`gpi_ch${defaultChannel}_pin${pin}_high`] = {
			type: 'button',
			category: `GPI Channel ${defaultChannel}`,
			name: `GPI ${pin} High`,
			style: {
				text: `GPI ${pin}\\nHIGH`,
				size: 'auto',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(0, 0, 0),
			},
			steps: [
				{
					down: [
						{
							actionId: 'gpi_assert',
							options: { channel: defaultChannel, pin: String(pin), level: 'high' },
						},
					],
					up: [],
				},
			],
			feedbacks: [],
		}

		// GPI Assert Low
		presets[`gpi_ch${defaultChannel}_pin${pin}_low`] = {
			type: 'button',
			category: `GPI Channel ${defaultChannel}`,
			name: `GPI ${pin} Low`,
			style: {
				text: `GPI ${pin}\\nLOW`,
				size: 'auto',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(0, 0, 0),
			},
			steps: [
				{
					down: [
						{
							actionId: 'gpi_assert',
							options: { channel: defaultChannel, pin: String(pin), level: 'low' },
						},
					],
					up: [],
				},
			],
			feedbacks: [],
		}

		// GPI Momentary (high on press, low on release)
		presets[`gpi_ch${defaultChannel}_pin${pin}_momentary`] = {
			type: 'button',
			category: `GPI Channel ${defaultChannel}`,
			name: `GPI ${pin} Momentary`,
			style: {
				text: `GPI ${pin}\\nMOM`,
				size: 'auto',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(0, 0, 0),
			},
			steps: [
				{
					down: [
						{
							actionId: 'gpi_assert',
							options: { channel: defaultChannel, pin: String(pin), level: 'low' },
						},
					],
					up: [
						{
							actionId: 'gpi_assert',
							options: { channel: defaultChannel, pin: String(pin), level: 'high' },
						},
					],
				},
			],
			feedbacks: [],
		}

		// GPO Received Monitor (shows GPO commands from console)
		presets[`gpo_ch${defaultChannel}_pin${pin}_monitor`] = {
			type: 'button',
			category: `GPO Received Channel ${defaultChannel}`,
			name: `GPO ${pin} Received`,
			style: {
				text: `GPO ${pin}\\n$(axia-livewire-gpio:gpo_${defaultChannel}_${pin}_received)`,
				size: 'auto',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(64, 64, 64),
			},
			steps: [{ down: [], up: [] }],
			feedbacks: [
				{
					feedbackId: 'gpo_received',
					options: {
						channel: defaultChannel,
						pin: String(pin),
						level: 'low',
					},
					style: {
						bgcolor: combineRgb(224, 218, 40),
						color: combineRgb(0, 0, 0),
					},
				},
			],
		}
	}

	self.setPresetDefinitions(presets)
}

export function UpdatePresets(self: GpioModuleInstance): void {
	if (self.config.role === 'node') {
		registerNodePresets(self)
	} else {
		registerConsolePresets(self)
	}
}
