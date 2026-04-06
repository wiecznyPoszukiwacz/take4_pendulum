import { type Result, ok, err } from "../../utils/Result.mjs"
import { TCellId, TCellValue, TRegistryCell } from "#types"

export class Registry {

	protected registry: Map<TCellId, TRegistryCell> = new Map()

	protected userWriteCbk: ((setting: TCellId, newValue: TCellValue, oldValue: TCellValue | null) => void) | null = null

	/** Registers a callback invoked whenever a user-writable cell is successfully changed */
	public onUserWrite(callback: (setting: TCellId, newValue: TCellValue, oldValue: TCellValue | null) => void): void {
		this.userWriteCbk = callback
	}

	/** Registers a cell in the registry with an optional initial value */
	public registerSetting(name: TCellId, userWritable: boolean = false, initialValue: TCellValue | null = null): void {
		this.registry.set(name, {
			name,
			value: initialValue,
			userWritable
		})
	}

	/** Writes a value to an existing cell; returns the previous value or Err if cell not found */
	protected write(name: TCellId, value: TCellValue): Result<TCellValue | null, string> {
		const cell = this.registry.get(name)
		if (!cell) {
			return err(`Cell not found: ${name}`)
		}

		const old = cell.value
		cell.value = value
		return ok(old)
	}

	/** Reads a cell value; returns Err if cell not found */
	protected read(name: TCellId): Result<TCellValue | null, string> {
		const cell = this.registry.get(name)
		if (!cell) {
			return err(`Cell not found: ${name}`)
		}

		return ok(cell.value)
	}

	/** Reads a cell value on behalf of a machine */
	public machineRead(name: TCellId): Result<TCellValue | null, string> {
		return this.read(name)
	}

	/** Writes a cell value on behalf of a machine */
	public machineWrite(name: TCellId, value: TCellValue): Result<TCellValue | null, string> {
		return this.write(name, value)
	}

	/** Reads a cell value on behalf of a user */
	public userRead(name: TCellId): Result<TCellValue | null, string> {
		return this.read(name)
	}

	/** Writes a user-writable cell; returns Err if cell not found or not writable */
	public userWrite(name: TCellId, value: TCellValue): Result<TCellValue | null, string> {
		const cell = this.registry.get(name)

		if (!cell) {
			return err(`Cell not found: ${name}`)
		}

		if (!cell.userWritable) {
			return err(`Cell is read-only: ${name}`)
		}

		if (cell.value === value) {
			return ok(value)
		}

		const result = this.write(name, value)

		if (result.ok && this.userWriteCbk) {
			this.userWriteCbk(name, value, result.value)
		}

		return result
	}

}
