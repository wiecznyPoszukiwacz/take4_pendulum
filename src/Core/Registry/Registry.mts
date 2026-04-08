import { type Result, ok, err } from "../../utils/Result.mjs"
import type { TCellId, TCellValue, TCellOptions, TCellTypeRules, TRegistryCell } from "#types"
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

	/** Registers a cell in the registry; uses persisted value if available, otherwise falls back to initialValue.
	 *  Throws an Error at startup if typeRules are provided and the initial value fails validation. */
	public registerSetting(name: TCellId, options: TCellOptions = {}): void {
		const { userWritable = false, initialValue = null, typeRules } = options
		const savedValue = this.persistedValues.has(name) ? this.persistedValues.get(name)! : initialValue
		if (typeRules && savedValue !== null) {
			const v = this.validate(savedValue, typeRules)
			if (!v.ok) throw new Error(`[Registry] invalid initialValue for "${name}": ${v.error}`)
		}
		this.registry.set(name, {
			name,
			value: savedValue,
			userWritable,
			typeRules
		})
	}

	/** Validates a value against cell type rules; returns Err with a description if validation fails */
	private validate(value: TCellValue, rules: TCellTypeRules): Result<void, string> {
		if (rules.type === 'boolean') {
			if (typeof value !== 'boolean') return err(`Expected boolean, got ${typeof value}`)
		} else if (rules.type === 'number') {
			if (typeof value !== 'number') return err(`Expected number, got ${typeof value}`)
			if (rules.min !== undefined && value < rules.min) return err(`Value ${value} is below min ${rules.min}`)
			if (rules.max !== undefined && value > rules.max) return err(`Value ${value} exceeds max ${rules.max}`)
		} else if (rules.type === 'string') {
			if (typeof value !== 'string') return err(`Expected string, got ${typeof value}`)
			if (rules.minLength !== undefined && value.length < rules.minLength)
				return err(`String length ${value.length} is below minLength ${rules.minLength}`)
			if (rules.maxLength !== undefined && value.length > rules.maxLength)
				return err(`String length ${value.length} exceeds maxLength ${rules.maxLength}`)
			if (rules.pattern !== undefined && !new RegExp(rules.pattern).test(value))
				return err(`Value does not match pattern ${rules.pattern}`)
		}
		return ok(undefined)
	}

	/** Writes a value to an existing cell; returns the previous value or Err if cell not found or validation fails */
	protected write(name: TCellId, value: TCellValue): Result<TCellValue | null, string> {
		const cell = this.registry.get(name)
		if (!cell) {
			return err(`Cell not found: ${name}`)
		}

		if (cell.typeRules) {
			const v = this.validate(value, cell.typeRules)
			if (!v.ok) return err(v.error)
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

	/** Returns all registered cells with their current values and metadata */
	public listCells(): TRegistryCell[] {
		return Array.from(this.registry.values())
	}

	/** Returns a single cell by name, or undefined if not registered */
	public getCell(name: TCellId): TRegistryCell | undefined {
		return this.registry.get(name)
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
