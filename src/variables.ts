import type { CompanionVariableDefinition } from '@companion-module/base'
import type { GpioModuleInstance } from './main.js'

export function UpdateVariableDefinitions(self: GpioModuleInstance): void {
	const variables: CompanionVariableDefinition[] = []

	if (self.config.role === 'node') {
		for (const [key] of self.gpoReceivedState) {
			const [channelStr, pinStr] = key.split(':')
			variables.push({
				variableId: `gpo_${channelStr}_${pinStr}_received`,
				name: `GPO Ch${channelStr} Pin${pinStr} Received`,
			})
		}
	} else {
		for (const [key] of self.gpiState) {
			const [channelStr, pinStr] = key.split(':')
			variables.push({
				variableId: `gpi_${channelStr}_${pinStr}_level`,
				name: `GPI Ch${channelStr} Pin${pinStr} Level`,
			})
		}
	}

	self.setVariableDefinitions(variables)
}

export function updateVariableValues(self: GpioModuleInstance): void {
	const values: Record<string, string | undefined> = {}

	if (self.config.role === 'node') {
		for (const [key, state] of self.gpoReceivedState) {
			const [channelStr, pinStr] = key.split(':')
			values[`gpo_${channelStr}_${pinStr}_received`] = state.level
		}
	} else {
		for (const [key, state] of self.gpiState) {
			const [channelStr, pinStr] = key.split(':')
			values[`gpi_${channelStr}_${pinStr}_level`] = state.level
		}
	}

	self.setVariableValues(values)
}
