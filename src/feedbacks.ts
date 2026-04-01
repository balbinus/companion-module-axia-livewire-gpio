import { combineRgb } from '@companion-module/base'
import type { GpioModuleInstance } from './main.js'
import { pinKey } from './gpio.js'

const PIN_CHOICES_GPI = [
	{ id: '1', label: 'GPI 1' },
	{ id: '2', label: 'GPI 2' },
	{ id: '3', label: 'GPI 3' },
	{ id: '4', label: 'GPI 4' },
	{ id: '5', label: 'GPI 5' },
]

const PIN_CHOICES_GPO = [
	{ id: '1', label: 'GPO 1' },
	{ id: '2', label: 'GPO 2' },
	{ id: '3', label: 'GPO 3' },
	{ id: '4', label: 'GPO 4' },
	{ id: '5', label: 'GPO 5' },
]

const LEVEL_CHOICES = [
	{ id: 'high', label: 'High' },
	{ id: 'low', label: 'Low' },
]

function registerConsoleFeedbacks(self: GpioModuleInstance): void {
	self.setFeedbackDefinitions({
		gpi_state: {
			name: 'GPI Pin State',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(0, 255, 0),
				color: combineRgb(0, 0, 0),
			},
			options: [
				{
					id: 'channel',
					type: 'number',
					label: 'Livewire Channel',
					default: 1,
					min: 1,
					max: 32767,
				},
				{
					id: 'pin',
					type: 'dropdown',
					label: 'GPI Pin',
					default: '1',
					choices: PIN_CHOICES_GPI,
				},
				{
					id: 'level',
					type: 'dropdown',
					label: 'Active when',
					default: 'high',
					choices: LEVEL_CHOICES,
				},
			],
			callback: (feedback) => {
				const channel = Number(feedback.options['channel'])
				const pin = Number(feedback.options['pin'])
				const expected = String(feedback.options['level'])

				const key = pinKey(channel, pin)
				const state = self.gpiState.get(key)
				if (!state) {
					return false
				}

				return state.level === expected
			},
		},
	})
}

function registerNodeFeedbacks(self: GpioModuleInstance): void {
	self.setFeedbackDefinitions({
		gpo_received: {
			name: 'GPO Received State',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(255, 165, 0),
				color: combineRgb(0, 0, 0),
			},
			options: [
				{
					id: 'channel',
					type: 'number',
					label: 'Livewire Channel',
					default: 1,
					min: 1,
					max: 32767,
				},
				{
					id: 'pin',
					type: 'dropdown',
					label: 'GPO Pin',
					default: '1',
					choices: PIN_CHOICES_GPO,
				},
				{
					id: 'level',
					type: 'dropdown',
					label: 'Active when',
					default: 'high',
					choices: LEVEL_CHOICES,
				},
			],
			callback: (feedback) => {
				const channel = Number(feedback.options['channel'])
				const pin = Number(feedback.options['pin'])
				const expected = String(feedback.options['level'])

				const key = pinKey(channel, pin)
				const state = self.gpoReceivedState.get(key)
				if (!state) {
					return false
				}

				return state.level === expected
			},
		},
	})
}

export function UpdateFeedbacks(self: GpioModuleInstance): void {
	if (self.config.role === 'node') {
		registerNodeFeedbacks(self)
	} else {
		registerConsoleFeedbacks(self)
	}
}
