import { InstanceBase, runEntrypoint, InstanceStatus, type SomeCompanionConfigField } from '@companion-module/base'
import dgram from 'dgram'
import { GetConfigFields, type GpioModuleConfig } from './config.js'
import { UpdateVariableDefinitions, updateVariableValues } from './variables.js'
import { UpgradeScripts } from './upgrades.js'
import { UpdateActions } from './actions.js'
import { UpdateFeedbacks } from './feedbacks.js'
import { UpdatePresets } from './presets.js'
import { CMSG2_HEADER_SIZE, parseCMsg2Header, parseCMsg2Leaves, resetPktCounter } from './cmsg2.js'
import {
	MULTICAST_ADDR,
	PORT_NODE_TO_CTRL,
	PORT_CTRL_TO_NODE,
	decodeLcid,
	decodeGpioState,
	pinKey,
	buildGpoCommand,
	buildGpiIndication,
	buildBatchPacket,
	type GpioStateMap,
} from './gpio.js'

export class GpioModuleInstance extends InstanceBase<GpioModuleConfig> {
	config!: GpioModuleConfig

	gpiState: GpioStateMap = new Map()
	gpoReceivedState: GpioStateMap = new Map()

	rxSocket: dgram.Socket | null = null
	txSocket: dgram.Socket | null = null

	constructor(internal: unknown) {
		super(internal)
	}

	async init(config: GpioModuleConfig): Promise<void> {
		this.config = config

		this.updateActions()
		this.updateFeedbacks()
		this.updatePresets()
		this.updateVariableDefinitions()

		this.startListening()
	}

	async destroy(): Promise<void> {
		this.stopListening()
		this.log('debug', 'destroy')
	}

	async configUpdated(config: GpioModuleConfig): Promise<void> {
		this.stopListening()

		this.config = config
		this.gpiState.clear()
		this.gpoReceivedState.clear()
		resetPktCounter()

		this.updateActions()
		this.updateFeedbacks()
		this.updatePresets()
		this.updateVariableDefinitions()

		this.startListening()
	}

	getConfigFields(): SomeCompanionConfigField[] {
		return GetConfigFields()
	}

	// ── Socket management ──

	startListening(): void {
		const iface = this.config.interfaceIp || '0.0.0.0'
		const isConsole = this.config.role !== 'node'
		const rxPort = isConsole ? PORT_NODE_TO_CTRL : PORT_CTRL_TO_NODE

		// Receive socket
		this.rxSocket = dgram.createSocket({ type: 'udp4', reuseAddr: true })

		this.rxSocket.on('error', (err) => {
			this.log('error', `Receive socket error: ${err.message}`)
			this.updateStatus(InstanceStatus.ConnectionFailure, err.message)
		})

		this.rxSocket.on('message', (msg: Buffer) => {
			this.handleIncomingPacket(msg)
		})

		this.rxSocket.bind(rxPort, () => {
			try {
				this.rxSocket!.addMembership(MULTICAST_ADDR, iface)
				this.log('info', `Listening on ${MULTICAST_ADDR}:${rxPort} (${this.config.role} mode, interface ${iface})`)
				this.updateStatus(InstanceStatus.Ok)
			} catch (err) {
				const message = err instanceof Error ? err.message : String(err)
				this.log('error', `Failed to join multicast group: ${message}`)
				this.updateStatus(InstanceStatus.ConnectionFailure, message)
			}
		})

		// Send socket
		this.txSocket = dgram.createSocket({ type: 'udp4', reuseAddr: true })

		this.txSocket.on('error', (err) => {
			this.log('error', `Send socket error: ${err.message}`)
		})

		this.txSocket.bind(() => {
			try {
				this.txSocket!.setMulticastInterface(iface)
			} catch (err) {
				const message = err instanceof Error ? err.message : String(err)
				this.log('error', `Failed to set multicast interface: ${message}`)
			}
		})
	}

	stopListening(): void {
		if (this.rxSocket) {
			try {
				this.rxSocket.dropMembership(MULTICAST_ADDR, this.config.interfaceIp || '0.0.0.0')
			} catch (_e) {
				// Ignore — socket may already be closed
			}
			this.rxSocket.close()
			this.rxSocket = null
		}

		if (this.txSocket) {
			this.txSocket.close()
			this.txSocket = null
		}
	}

	// ── Packet handling ──

	handleIncomingPacket(buf: Buffer): void {
		const header = parseCMsg2Header(buf)
		if (!header) {
			return
		}

		const isConsole = this.config.role !== 'node'

		if (isConsole) {
			this.handleConsolePacket(header.messageName, buf, header.numLeaves)
		} else {
			this.handleNodePacket(header.messageName, buf, header.numLeaves)
		}
	}

	handleConsolePacket(messageName: string, buf: Buffer, numLeaves: number): void {
		if (messageName !== 'INDI') {
			this.log('debug', `Console mode: ignoring message type: ${messageName}`)
			return
		}

		const leaves = parseCMsg2Leaves(buf, CMSG2_HEADER_SIZE, numLeaves)

		for (const leaf of leaves) {
			if (leaf.type !== 0x07) {
				continue
			}

			const { channel, direction, pin } = decodeLcid(leaf.lcid)
			if (direction !== 'gpi') {
				continue
			}

			const stateValue = leaf.rawValue.readUInt8(0)
			const decoded = decodeGpioState(stateValue)
			const key = pinKey(channel, pin)

			this.gpiState.set(key, {
				level: decoded.level,
				lastUpdate: Date.now(),
			})

			this.log(
				'debug',
				`GPI ${channel}:${pin} → ${decoded.level}` +
					(decoded.pulse ? ` (pulse ${decoded.durationMs}ms)` : ' (latched)'),
			)
		}

		UpdateVariableDefinitions(this)
		updateVariableValues(this)
		this.checkFeedbacks('gpi_state')
	}

	handleNodePacket(messageName: string, buf: Buffer, numLeaves: number): void {
		if (messageName !== 'WRNI') {
			this.log('debug', `Node mode: ignoring message type: ${messageName}`)
			return
		}

		const leaves = parseCMsg2Leaves(buf, CMSG2_HEADER_SIZE, numLeaves)

		for (const leaf of leaves) {
			if (leaf.type !== 0x07) {
				continue
			}

			const { channel, direction, pin } = decodeLcid(leaf.lcid)
			if (direction !== 'gpo') {
				continue
			}

			const stateValue = leaf.rawValue.readUInt8(0)
			const decoded = decodeGpioState(stateValue)
			const key = pinKey(channel, pin)

			this.gpoReceivedState.set(key, {
				level: decoded.level,
				lastUpdate: Date.now(),
			})

			this.log(
				'debug',
				`GPO received ${channel}:${pin} → ${decoded.level}` +
					(decoded.pulse ? ` (pulse ${decoded.durationMs}ms)` : ' (latched)'),
			)
		}

		UpdateVariableDefinitions(this)
		updateVariableValues(this)
		this.checkFeedbacks('gpo_received')
	}

	// ── Send methods (Console mode: GPO commands) ──

	sendGpoCommand(channel: number, pin: number, level: 'high' | 'low', durationMs?: number): void {
		if (!this.txSocket) {
			this.log('error', 'Send socket not available')
			return
		}

		const packet = buildGpoCommand(channel, pin, level, durationMs)
		this.txSocket.send(packet, 0, packet.length, PORT_CTRL_TO_NODE, MULTICAST_ADDR, (err) => {
			if (err) {
				this.log('error', `Failed to send GPO command: ${err.message}`)
			} else {
				this.log('debug', `GPO ${channel}:${pin} → ${level}` + (durationMs ? ` (pulse ${durationMs}ms)` : ' (latched)'))
			}
		})
	}

	sendGpoCommandBatch(
		commands: Array<{ channel: number; pin: number; level: 'high' | 'low'; durationMs?: number }>,
	): void {
		if (!this.txSocket) {
			this.log('error', 'Send socket not available')
			return
		}

		const packet = buildBatchPacket(
			'WRNI',
			commands.map((cmd) => ({ ...cmd, direction: 'gpo' as const })),
		)
		this.txSocket.send(packet, 0, packet.length, PORT_CTRL_TO_NODE, MULTICAST_ADDR, (err) => {
			if (err) {
				this.log('error', `Failed to send GPO batch command: ${err.message}`)
			}
		})
	}

	// ── Send methods (Node mode: GPI indications) ──

	sendGpiIndication(channel: number, pin: number, level: 'high' | 'low', durationMs?: number): void {
		if (!this.txSocket) {
			this.log('error', 'Send socket not available')
			return
		}

		const packet = buildGpiIndication(channel, pin, level, durationMs)
		this.txSocket.send(packet, 0, packet.length, PORT_NODE_TO_CTRL, MULTICAST_ADDR, (err) => {
			if (err) {
				this.log('error', `Failed to send GPI indication: ${err.message}`)
			} else {
				this.log(
					'debug',
					`GPI indication ${channel}:${pin} → ${level}` + (durationMs ? ` (pulse ${durationMs}ms)` : ' (latched)'),
				)
			}
		})
	}

	sendGpiIndicationBatch(
		commands: Array<{ channel: number; pin: number; level: 'high' | 'low'; durationMs?: number }>,
	): void {
		if (!this.txSocket) {
			this.log('error', 'Send socket not available')
			return
		}

		const packet = buildBatchPacket(
			'INDI',
			commands.map((cmd) => ({ ...cmd, direction: 'gpi' as const })),
		)
		this.txSocket.send(packet, 0, packet.length, PORT_NODE_TO_CTRL, MULTICAST_ADDR, (err) => {
			if (err) {
				this.log('error', `Failed to send GPI batch indication: ${err.message}`)
			}
		})
	}

	// ── Update helpers ──

	updateActions(): void {
		UpdateActions(this)
	}

	updateFeedbacks(): void {
		UpdateFeedbacks(this)
	}

	updatePresets(): void {
		UpdatePresets(this)
	}

	updateVariableDefinitions(): void {
		UpdateVariableDefinitions(this)
	}
}

runEntrypoint(GpioModuleInstance, UpgradeScripts)
