/**
 * GPIO-specific LCID encoding, circuit mapping, and state encoding/decoding
 * for Axia Livewire GPIO over the CMsg2 protocol.
 */

import { buildCMsg2Packet } from './cmsg2.js'

// ── Network constants ──

export const MULTICAST_ADDR = '239.192.255.4'
export const PORT_NODE_TO_CTRL = 2055 // GPIO node → console/controller (GPI indications)
export const PORT_CTRL_TO_NODE = 2060 // Console/controller → GPIO node (GPO commands)

// ── Direction type ──

export type GpioDirection = 'gpi' | 'gpo'

// ── GPIO state constants ──

export const GPIO_STATE_HIGH = 0x00
export const GPIO_STATE_LOW = /*0xc0*/ 0x1 // Use 0x01 for "GPI devices"

// ── Pin state interface ──

export interface GpioPinState {
	level: 'high' | 'low'
	pulse: boolean
	durationMs: number | null // null for latched states
}

export interface TrackedPinState {
	level: 'high' | 'low' | 'unknown'
	lastUpdate: number // Date.now()
}

// Key: "channel:pin" e.g. "11699:3"
export type GpioStateMap = Map<string, TrackedPinState>

// ── Helpers ──

export function pinKey(channel: number, pin: number): string {
	return `${channel}:${pin}`
}

// ── Circuit encoding/decoding ──

export function encodeCircuit(direction: GpioDirection, pin: number): number {
	// pin is 1-based (1–5)
	if (direction === 'gpo') {
		return 9 - pin // GPO: 9−pin → 0x08..0x04
	}
	return 14 - pin // GPI: 14−pin → 0x0D..0x09
}

export function decodeCircuit(circuit: number): { direction: GpioDirection; pin: number } {
	const masked = circuit & 0x0f
	if (masked <= 0x08) {
		return { direction: 'gpo', pin: 9 - masked }
	}
	return { direction: 'gpi', pin: 14 - masked }
}

export function encodeLcid(channel: number, direction: GpioDirection, pin: number): number {
	return (channel << 8) | encodeCircuit(direction, pin)
}

export function decodeLcid(lcid: number): { channel: number; direction: GpioDirection; pin: number } {
	const channel = (lcid >> 8) & 0xffff
	const circuitByte = lcid & 0xff
	const { direction, pin } = decodeCircuit(circuitByte)
	return { channel, direction, pin }
}

// ── GPIO state decoding ──

export function decodeGpioState(value: number): GpioPinState {
	if (value === 0) {
		return { level: 'high', pulse: false, durationMs: null }
	}
	if (value === 1) {
		// Special case: GPI devices report Low as 1
		return { level: 'low', pulse: false, durationMs: null }
	}
	if (value >= 2 && value <= 31) {
		return { level: 'high', pulse: true, durationMs: value * 250 }
	}
	if (value === 64) {
		return { level: 'low', pulse: false, durationMs: null }
	}
	if (value >= 65 && value <= 95) {
		return { level: 'low', pulse: true, durationMs: (value - 64) * 250 }
	}
	if (value === 128) {
		return { level: 'high', pulse: false, durationMs: null }
	}
	if (value >= 129 && value <= 191) {
		return { level: 'high', pulse: true, durationMs: (value - 128) * 10 }
	}
	if (value === 192) {
		return { level: 'low', pulse: false, durationMs: null }
	}
	if (value >= 193 && value <= 255) {
		return { level: 'low', pulse: true, durationMs: (value - 192) * 10 }
	}
	// Undefined range (32–63, 96–127)
	return { level: 'low', pulse: false, durationMs: null }
}

// ── GPIO state encoding ──

export function encodeGpioState(level: 'high' | 'low', durationMs?: number): number {
	// Latched
	if (durationMs === undefined || durationMs === 0) {
		return level === 'high' ? GPIO_STATE_HIGH : GPIO_STATE_LOW
	}

	// Prefer the 10ms-resolution range (128–191 / 193–255) for short pulses
	if (durationMs <= 630) {
		const ticks = Math.round(durationMs / 10)
		if (level === 'high') {
			return 128 + Math.max(1, Math.min(63, ticks))
		}
		return 192 + Math.max(1, Math.min(63, ticks))
	}

	// Use 250ms-resolution range (2–31 / 65–95) for longer pulses
	const ticks = Math.round(durationMs / 250)
	if (level === 'high') {
		return Math.max(2, Math.min(31, ticks))
	}
	return 64 + Math.max(1, Math.min(31, ticks))
}

// ── Convenience packet builders ──

export function buildGpoCommand(channel: number, pin: number, level: 'high' | 'low', durationMs?: number): Buffer {
	const lcid = encodeLcid(channel, 'gpo', pin)
	const stateValue = encodeGpioState(level, durationMs)
	const value = Buffer.alloc(1)
	value.writeUInt8(stateValue, 0)

	return buildCMsg2Packet('WRNI', [{ lcid, type: 0x07, value }])
}

export function buildGpiIndication(channel: number, pin: number, level: 'high' | 'low', durationMs?: number): Buffer {
	const lcid = encodeLcid(channel, 'gpi', pin)
	const stateValue = encodeGpioState(level, durationMs)
	const value = Buffer.alloc(1)
	value.writeUInt8(stateValue, 0)

	return buildCMsg2Packet('INDI', [{ lcid, type: 0x07, value }])
}

export function buildBatchPacket(
	messageName: string,
	commands: Array<{
		channel: number
		direction: GpioDirection
		pin: number
		level: 'high' | 'low'
		durationMs?: number
	}>,
): Buffer {
	const leaves = commands.map((cmd) => {
		const lcid = encodeLcid(cmd.channel, cmd.direction, cmd.pin)
		const stateValue = encodeGpioState(cmd.level, cmd.durationMs)
		const value = Buffer.alloc(1)
		value.writeUInt8(stateValue, 0)
		return { lcid, type: 0x07, value }
	})

	return buildCMsg2Packet(messageName, leaves)
}
