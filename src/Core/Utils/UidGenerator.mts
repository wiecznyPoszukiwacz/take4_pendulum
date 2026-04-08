const BASE62 = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
const COUNTER_LENGTH = 3
const UID_PATTERN = /^MCH-([A-Z]{4})-([0-9a-zA-Z]{3})$/

/** Encodes a non-negative integer as a base62 string padded to the given length */
function encodeBase62(n: number, length: number): string {
	let result = ''
	let remaining = n
	for (let i = 0; i < length; i++) {
		result = BASE62[remaining % 62] + result
		remaining = Math.floor(remaining / 62)
	}
	return result
}

/** Decodes a base62 string to a non-negative integer */
function decodeBase62(s: string): number {
	let result = 0
	for (const char of s) {
		result = result * 62 + BASE62.indexOf(char)
	}
	return result
}

export class UidGenerator {

	private readonly counters: Map<string, number> = new Map()

	/** Parses existing UIDs in MCH-{XXXX}-{YYY} format and initialises per-typeCode counters */
	public seed(uids: string[]): void {
		for (const uid of uids) {
			const match = UID_PATTERN.exec(uid)
			if (!match) continue
			const typeCode = match[1]!
			const counter = decodeBase62(match[2]!)
			const current = this.counters.get(typeCode) ?? 0
			if (counter > current) {
				this.counters.set(typeCode, counter)
			}
		}
	}

	/** Generates the next unique UID for the given 4-letter typeCode */
	public generate(typeCode: string): string {
		const code = typeCode.toUpperCase().slice(0, 4).padEnd(4, 'X')
		const next = (this.counters.get(code) ?? 0) + 1
		this.counters.set(code, next)
		return `MCH-${code}-${encodeBase62(next, COUNTER_LENGTH)}`
	}

}
