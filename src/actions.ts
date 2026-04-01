import type { GpioModuleInstance } from './main.js'
import { pinKey } from './gpio.js'

const PIN_CHOICES = [
	{ id: '1', label: 'Pin 1' },
	{ id: '2', label: 'Pin 2' },
	{ id: '3', label: 'Pin 3' },
	{ id: '4', label: 'Pin 4' },
	{ id: '5', label: 'Pin 5' },
]

const LEVEL_CHOICES = [
	{ id: 'high', label: 'High (Active)' },
	{ id: 'low', label: 'Low (Inactive)' },
]

const ALL_PIN_CHOICES = [
	{ id: 'high', label: 'High' },
	{ id: 'low', label: 'Low' },
	{ id: 'skip', label: 'No change' },
]

function registerConsoleActions(self: GpioModuleInstance): void {
	self.setActionDefinitions({
		gpo_set: {
			name: 'Set GPO Pin (Latched)',
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
					choices: PIN_CHOICES,
				},
				{
					id: 'level',
					type: 'dropdown',
					label: 'Level',
					default: 'high',
					choices: LEVEL_CHOICES,
				},
			],
			callback: async (event) => {
				const channel = Number(event.options['channel'])
				const pin = Number(event.options['pin'])
				const level = String(event.options['level']) as 'high' | 'low'
				self.sendGpoCommand(channel, pin, level)
			},
		},

		gpo_pulse: {
			name: 'Pulse GPO Pin',
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
					choices: PIN_CHOICES,
				},
				{
					id: 'level',
					type: 'dropdown',
					label: 'Pulse Level',
					default: 'high',
					choices: [
						{ id: 'high', label: 'Pulse High' },
						{ id: 'low', label: 'Pulse Low' },
					],
				},
				{
					id: 'duration',
					type: 'number',
					label: 'Duration (ms)',
					tooltip: '10–630ms in 10ms steps, 250–7750ms in 250ms steps',
					default: 500,
					min: 10,
					max: 7750,
				},
			],
			callback: async (event) => {
				const channel = Number(event.options['channel'])
				const pin = Number(event.options['pin'])
				const level = String(event.options['level']) as 'high' | 'low'
				const duration = Number(event.options['duration'])
				self.sendGpoCommand(channel, pin, level, duration)
			},
		},

		gpo_toggle: {
			name: 'Toggle GPO Pin',
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
					choices: PIN_CHOICES,
				},
			],
			callback: async (event) => {
				const channel = Number(event.options['channel'])
				const pin = Number(event.options['pin'])
				const key = pinKey(channel, pin)
				const current = self.gpiState.get(key)
				const newLevel = current?.level === 'high' ? 'low' : 'high'
				self.sendGpoCommand(channel, pin, newLevel)
			},
		},

		gpo_all_pins: {
			name: 'Set All GPO Pins on Channel',
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
					id: 'pin1',
					type: 'dropdown',
					label: 'GPO 1',
					default: 'high',
					choices: ALL_PIN_CHOICES,
				},
				{
					id: 'pin2',
					type: 'dropdown',
					label: 'GPO 2',
					default: 'high',
					choices: ALL_PIN_CHOICES,
				},
				{
					id: 'pin3',
					type: 'dropdown',
					label: 'GPO 3',
					default: 'high',
					choices: ALL_PIN_CHOICES,
				},
				{
					id: 'pin4',
					type: 'dropdown',
					label: 'GPO 4',
					default: 'high',
					choices: ALL_PIN_CHOICES,
				},
				{
					id: 'pin5',
					type: 'dropdown',
					label: 'GPO 5',
					default: 'high',
					choices: ALL_PIN_CHOICES,
				},
			],
			callback: async (event) => {
				const channel = Number(event.options['channel'])
				const commands: Array<{ channel: number; pin: number; level: 'high' | 'low' }> = []

				for (let p = 1; p <= 5; p++) {
					const val = String(event.options[`pin${p}`])
					if (val !== 'skip') {
						commands.push({ channel, pin: p, level: val as 'high' | 'low' })
					}
				}

				if (commands.length > 0) {
					self.sendGpoCommandBatch(commands)
				}
			},
		},
	})
}

function registerNodeActions(self: GpioModuleInstance): void {
	self.setActionDefinitions({
		gpi_assert: {
			name: 'Assert GPI Pin (Latched)',
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
					choices: PIN_CHOICES,
				},
				{
					id: 'level',
					type: 'dropdown',
					label: 'Level',
					default: 'high',
					choices: LEVEL_CHOICES,
				},
			],
			callback: async (event) => {
				const channel = Number(event.options['channel'])
				const pin = Number(event.options['pin'])
				const level = String(event.options['level']) as 'high' | 'low'
				self.sendGpiIndication(channel, pin, level)
			},
		},

		gpi_pulse: {
			name: 'Pulse GPI Pin',
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
					choices: PIN_CHOICES,
				},
				{
					id: 'level',
					type: 'dropdown',
					label: 'Pulse Level',
					default: 'high',
					choices: [
						{ id: 'high', label: 'Pulse High' },
						{ id: 'low', label: 'Pulse Low' },
					],
				},
				{
					id: 'duration',
					type: 'number',
					label: 'Duration (ms)',
					tooltip: '10–630ms in 10ms steps, 250–7750ms in 250ms steps',
					default: 500,
					min: 10,
					max: 7750,
				},
			],
			callback: async (event) => {
				const channel = Number(event.options['channel'])
				const pin = Number(event.options['pin'])
				const level = String(event.options['level']) as 'high' | 'low'
				const duration = Number(event.options['duration'])
				self.sendGpiIndication(channel, pin, level, duration)
			},
		},

		gpi_all_pins: {
			name: 'Set All GPI Pins on Channel',
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
					id: 'pin1',
					type: 'dropdown',
					label: 'GPI 1',
					default: 'high',
					choices: ALL_PIN_CHOICES,
				},
				{
					id: 'pin2',
					type: 'dropdown',
					label: 'GPI 2',
					default: 'high',
					choices: ALL_PIN_CHOICES,
				},
				{
					id: 'pin3',
					type: 'dropdown',
					label: 'GPI 3',
					default: 'high',
					choices: ALL_PIN_CHOICES,
				},
				{
					id: 'pin4',
					type: 'dropdown',
					label: 'GPI 4',
					default: 'high',
					choices: ALL_PIN_CHOICES,
				},
				{
					id: 'pin5',
					type: 'dropdown',
					label: 'GPI 5',
					default: 'high',
					choices: ALL_PIN_CHOICES,
				},
			],
			callback: async (event) => {
				const channel = Number(event.options['channel'])
				const commands: Array<{ channel: number; pin: number; level: 'high' | 'low' }> = []

				for (let p = 1; p <= 5; p++) {
					const val = String(event.options[`pin${p}`])
					if (val !== 'skip') {
						commands.push({ channel, pin: p, level: val as 'high' | 'low' })
					}
				}

				if (commands.length > 0) {
					self.sendGpiIndicationBatch(commands)
				}
			},
		},
	})
}

export function UpdateActions(self: GpioModuleInstance): void {
	if (self.config.role === 'node') {
		registerNodeActions(self)
	} else {
		registerConsoleActions(self)
	}
}
