import { type Result, ok, err } from "../../../utils/Result.mjs"
import { GenericMachine } from "../Machines/GenericMachine.mjs"
import { Library } from "../../Utils/Library.mjs"
import { MachinesPersistencyYaml } from "../../Persistency/MachinesPersistency.mjs"
import type { TMachineConfig } from "../../Persistency/types.mjs"
import type { RegistryPersistence } from "../../Registry/Persistence/RegistryPersistence.mjs"

export class MachineCollection {

	protected machines: Map<string, GenericMachine>
	protected machineRunnerMapping: Map<string, Set<string>>

	/** Creates a MachineCollection by loading machine definitions from YAML via persistency and instantiating them via library */
	public static async create(
		persistency: MachinesPersistencyYaml,
		library: Library<GenericMachine>,
		registryPersistence?: RegistryPersistence
	): Promise<MachineCollection> {

		const collection = new MachineCollection()
		await collection.init(persistency, library, registryPersistence)

		return collection

	}

	protected constructor() {
		this.machines = new Map()
		this.machineRunnerMapping = new Map()
	}

	/** Instantiates a single machine using library to resolve its class, then registers it in the collection */
	public async addMachine(
		config: TMachineConfig,
		library: Library<GenericMachine>,
		registryPersistence?: RegistryPersistence
	): Promise<GenericMachine> {

		const MachineClass = library.getItem(config.library) ?? GenericMachine
		const machine = new MachineClass(config.uid, config.configuration)
		await machine.init(registryPersistence)

		this.machines.set(config.uid, machine)

		if (!this.machineRunnerMapping.has(config.runner)) {
			this.machineRunnerMapping.set(config.runner, new Set())
		}

		this.machineRunnerMapping.get(config.runner)!.add(config.uid)

		return machine
	}

	/** Loads machine configurations from persistency and creates all machines */
	protected async init(
		persistency: MachinesPersistencyYaml,
		library: Library<GenericMachine>,
		registryPersistence?: RegistryPersistence
	): Promise<void> {

		const configs = await persistency.load()

		for (const config of configs) {
			await this.addMachine(config, library, registryPersistence)
		}
	}

	public getMachines(runnerUid: string): Array<GenericMachine> {

		if (!this.machineRunnerMapping.has(runnerUid)) {
			return []
		}

		const machines =
			Array.from(this.machineRunnerMapping.get(runnerUid)!)
				.map(u => this.machines.get(u) as GenericMachine)

		return machines
	}

	/** Returns the machine with the given UID, or Err if it does not exist */
	public getMachine(machineUid: string): Result<GenericMachine, string> {
		const machine = this.machines.get(machineUid)
		return machine ? ok(machine) : err(`Machine not found: ${machineUid}`)
	}

	/** Destroys the machine and removes it from the collection and runner mapping; returns Err if not found */
	public removeMachine(machineUid: string): Result<void, string> {
		const machine = this.machines.get(machineUid)
		if (!machine) return err(`Machine not found: ${machineUid}`)

		machine.destroy()
		this.machines.delete(machineUid)

		for (const [, uids] of this.machineRunnerMapping) {
			uids.delete(machineUid)
		}

		return ok(undefined)
	}

	public debugGetAllMachines() {
		return [...this.machines]
	}

}
