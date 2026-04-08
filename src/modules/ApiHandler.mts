import { type TCellValue, type TRegistryCell } from "#types"
import { isOk } from "../utils/Result.mjs"
import { Pendulum } from "../pendulum/Pendulum.mjs"

export class ApiHandler {

	protected pendulum: Pendulum

	public constructor(pendulum: Pendulum) {
		this.pendulum = pendulum
	}

	/** Returns basic status of the pendulum */
	public getStatus() {
		return this.pendulum.getStatus();
	}

	/** Returns list of all runner UIDs */
	public getRunners(): Array<string> {
		return Array.from(this.pendulum.getRunners().keys())
	}

	/** Returns status of the given runner; throws if runner does not exist */
	public getRunnerStatus(params: { runnerUid: string }) {
		return this.getRunner(params.runnerUid).getStatus()
	}

	/** Returns list of machine UIDs registered in the given runner */
	public getMachines(params: { runnerUid: string }): Array<string> {
		return Array.from(this.getRunner(params.runnerUid).getMachines().keys())
	}

	/** Writes a setting on the given machine; throws if machine or cell not found or read-only */
	public configureMachine(params: { machineUid: string; settingName: string; value: TCellValue }) {
		const result = this.pendulum.configureMachine(params.machineUid, params.settingName, params.value)
		if (!isOk(result)) throw new Error(result.error)
		return { previous: result.value }
	}

	/** Reads a setting from the given machine; throws if machine or cell not found */
	public readMachineConfig(params: { machineUid: string; settingName: string }) {
		const result = this.pendulum.readMachineSetup(params.machineUid, params.settingName)
		if (!isOk(result)) throw new Error(result.error)
		return result.value
	}

	/** Returns all registry cells for the given machine with their metadata */
	public listCells(params: { machineUid: string }): TRegistryCell[] {
		const result = this.pendulum.getMachineCells(params.machineUid)
		if (!isOk(result)) throw new Error(result.error)
		return result.value
	}

	/** Returns a single registry cell with metadata; returns null if cell not found */
	public getCell(params: { machineUid: string; cellId: string }): TRegistryCell | null {
		const result = this.pendulum.getMachineCell(params.machineUid, params.cellId)
		if (!isOk(result)) throw new Error(result.error)
		return result.value ?? null
	}

	/** Writes a value to a user-writable cell; returns previous value */
	public setCell(params: { machineUid: string; cellId: string; value: TCellValue }): { previous: TCellValue | null } {
		const result = this.pendulum.configureMachine(params.machineUid, params.cellId, params.value)
		if (!isOk(result)) throw new Error(result.error)
		return { previous: result.value }
	}

	/** Returns a snapshot of all cells in a machine's registry */
	public getMachineSnapshot(params: { machineUid: string }): { uid: string; cells: TRegistryCell[] } {
		const result = this.pendulum.getMachineCells(params.machineUid)
		if (!isOk(result)) throw new Error(result.error)
		return { uid: params.machineUid, cells: result.value }
	}

	/** Returns the names of all machine types available in the library */
	public listMachineTypes(): string[] {
		return this.pendulum.listMachineTypes()
	}

	/** Creates a new machine and registers it in the given runner; uid is generated server-side */
	public async createMachine(params: { runner: string; library: string; configuration?: unknown }): Promise<{ uid: string }> {
		const result = await this.pendulum.createMachine(params)
		if (!isOk(result)) throw new Error(result.error)
		return { uid: result.value }
	}

	/** Destroys and removes a machine from the collection and its runner */
	public deleteMachine(params: { machineUid: string }): void {
		const result = this.pendulum.deleteMachine(params.machineUid)
		if (!isOk(result)) throw new Error(result.error)
	}

	/** Returns debug status of all machines */
	public debugMachinesList() {
		return this.pendulum.debugGetAllMachines().map(([, m]) => m.debugStatus())
	}

	/** Returns the runner with the given UID; throws if not found */
	protected getRunner(runnerId: string) {
		const runner = this.pendulum.getRunners().get(runnerId)
		if (!runner) throw new Error(`Runner not found: ${runnerId}`)
		return runner
	}
}
