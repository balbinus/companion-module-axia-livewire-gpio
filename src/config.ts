import { Regex, type SomeCompanionConfigField } from '@companion-module/base'

export interface GpioModuleConfig {
	interfaceIp: string
	role: 'console' | 'node'
}

export function GetConfigFields(): SomeCompanionConfigField[] {
	return [
		{
			type: 'textinput',
			id: 'interfaceIp',
			label: 'Network Interface IP',
			tooltip: 'IP address of the network interface to use for multicast. Use 0.0.0.0 for the default interface.',
			width: 6,
			regex: Regex.IP,
			default: '0.0.0.0',
		},
		{
			type: 'dropdown',
			id: 'role',
			label: 'Operating Mode',
			tooltip:
				'Console: listen for GPI indications, send GPO commands. Node: listen for GPO commands, send GPI indications.',
			width: 6,
			default: 'console',
			choices: [
				{ id: 'console', label: 'Console (send GPO, receive GPI)' },
				{ id: 'node', label: 'Node (send GPI, receive GPO)' },
			],
		},
	]
}
