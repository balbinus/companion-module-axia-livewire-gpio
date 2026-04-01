/**
 * CMsg2 binary protocol codec for Axia Livewire.
 *
 * Handles packet building, parsing, header/leaf structures.
 * This module is protocol-generic — no GPIO-specific logic.
 */

export const CMSG2_MAGIC = 0x03000207
export const CMSG2_HEADER_SIZE = 22

export interface CMsg2Header {
	magic: number
	pktNum: number
	messageName: string
	numLeaves: number
}

export interface CMsg2Leaf {
	lcid: number
	type: number
	rawValue: Buffer
}

let pktCounter = 0

export function nextPktNum(): number {
	pktCounter++
	return pktCounter
}

export function resetPktCounter(): void {
	pktCounter = 0
}

/**
 * Parse the 22-byte CMsg2 header from a buffer.
 * Returns null if the buffer is too short or the magic/filler are invalid.
 */
export function parseCMsg2Header(buf: Buffer): CMsg2Header | null {
	if (buf.length < CMSG2_HEADER_SIZE) {
		return null
	}

	const magic = buf.readUInt32BE(0)
	if (magic !== CMSG2_MAGIC) {
		return null
	}

	// Verify filler is zero (bytes 8–15)
	for (let i = 8; i < 16; i++) {
		if (buf[i] !== 0) {
			return null
		}
	}

	return {
		magic,
		pktNum: buf.readUInt32BE(4),
		messageName: buf.toString('ascii', 16, 20),
		numLeaves: buf.readUInt16BE(20),
	}
}

/**
 * Parse leaf entries from a CMsg2 packet body.
 * Each leaf is: 4-byte name (LCID) + 1-byte type + variable-length value.
 */
export function parseCMsg2Leaves(buf: Buffer, offset: number, count: number): CMsg2Leaf[] {
	const leaves: CMsg2Leaf[] = []
	let pos = offset

	for (let i = 0; i < count; i++) {
		if (pos + 5 > buf.length) {
			break
		}

		const lcid = buf.readUInt32BE(pos)
		pos += 4

		const type = buf.readUInt8(pos)
		pos += 1

		let valueLen: number
		switch (type) {
			case 0x07:
				valueLen = 1
				break // INT8
			case 0x08:
				valueLen = 2
				break // INT16
			case 0x01:
				valueLen = 4
				break // INT32
			case 0x09:
				valueLen = 8
				break // INT64
			default:
				valueLen = 0
				break // Unknown — skip safely
		}

		if (pos + valueLen > buf.length) {
			break
		}

		const rawValue = Buffer.from(buf.subarray(pos, pos + valueLen))
		pos += valueLen

		leaves.push({ lcid, type, rawValue })
	}

	return leaves
}

/**
 * Build a complete CMsg2 packet from a message name and leaf array.
 */
export function buildCMsg2Packet(
	messageName: string,
	leaves: Array<{ lcid: number; type: number; value: Buffer }>,
): Buffer {
	let payloadSize = 0
	for (const leaf of leaves) {
		payloadSize += 4 + 1 + leaf.value.length // name + type + value
	}

	const buf = Buffer.alloc(CMSG2_HEADER_SIZE + payloadSize)
	let offset = 0

	// Magic
	buf.writeUInt32BE(CMSG2_MAGIC, offset)
	offset += 4

	// Packet number
	buf.writeUInt32BE(nextPktNum(), offset)
	offset += 4

	// Filler (8 bytes of zeros — Buffer.alloc already zeroes)
	offset += 8

	// Message name (4 ASCII bytes)
	buf.write(messageName.padEnd(4).substring(0, 4), offset, 4, 'ascii')
	offset += 4

	// Num leaves
	buf.writeUInt16BE(leaves.length, offset)
	offset += 2

	// Leaves
	for (const leaf of leaves) {
		buf.writeUInt32BE(leaf.lcid, offset)
		offset += 4
		buf.writeUInt8(leaf.type, offset)
		offset += 1
		leaf.value.copy(buf, offset)
		offset += leaf.value.length
	}

	return buf
}
