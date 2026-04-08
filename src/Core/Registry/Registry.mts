import { type Result, ok, err } from "../../utils/Result.mjs"
import { TCellId, TCellValue, TRegistryCell } from "#types"
import { RegistryEventAggregator } from "./RegistryEventAggregator.mjs"
import type { RegistryPersistence } from "./Persistence/RegistryPersistence.mjs"

export class Registry {

	protected registry: Map<TCellId, TRegistryCell> = new Map()
	private readonly machineUid: string
	private persistedValues: Map<TCellId, TCellValue | null> = new Map()

	public constructor(machineUid: string) {
		this.machineUid = machineUid
	}

	/** Loads persisted cell values from the given persistence backend; must be called before registerSetting() */
	public async initPersistence(persistence: RegistryPersistence): Promise<void> {
		this.persistedValues = await persistence.loadMachine(this.machineUid)
	}

	/** Registers a cell in the registry; uses persisted value if available, otherwise falls back to initialValue */
	public registerSetting(name: TCellId, userWritable: boolean = false, initialValue: TCellValue | null = null): void {
		const savedValue = this.persistedValues.has(name) ? this.persistedValues.get(name)! : initialValue
		this.registry.set(name, {
			name,
			value: savedValue,
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

	/** Writes a cell value on behalf of a machine and emits a machine-sourced event */
	public machineWrite(name: TCellId, value: TCellValue): Result<TCellValue | null, string> {
		const result = this.write(name, value)
		if (result.ok) {
			RegistryEventAggregator.getInstance().emit({
				machineUid: this.machineUid,
				cellId: name,
				newValue: value,
				oldValue: result.value,
				source: 'machine'
			})
		}
		return result
	}

	/** Reads a cell value on behalf of a user */
	public userRead(name: TCellId): Result<TCellValue | null, string> {
		return this.read(name)
	}

	/** Writes a user-writable cell and emits a user-sourced event; returns Err if cell not found or not writable */
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

		if (result.ok) {
			RegistryEventAggregator.getInstance().emit({
				machineUid: this.machineUid,
				cellId: name,
				newValue: value,
				oldValue: result.value,
				source: 'user'
			})
		}

		return result
	}

}
