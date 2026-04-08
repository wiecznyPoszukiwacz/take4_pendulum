import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { type Result, flatMap, ok, err } from "../utils/Result.mjs"
import { type TCellId, type TCellValue, type TRegistryCell } from "#types"
import { MachineCollection } from "../Core/StateMachines/Collections/Collection.mjs"
import { MachineRunner } from "../Core/StateMachines/Runners/GenericRunner.mjs"
import { Library } from "../Core/Utils/Library.mjs"
import { UidGenerator } from "../Core/Utils/UidGenerator.mjs"
import { MachinesPersistencyYaml } from "../Core/Persistency/MachinesPersistency.mjs"
import { GenericMachine } from "../Core/StateMachines/Machines/GenericMachine.mjs"
import type { TCreateMachineParams } from "../Core/Persistency/types.mjs"
import { ConsoleMonitor } from "../Core/Monitor/ConsoleMonitor.mjs"
import { WebSocketMonitor } from "../Core/Monitor/WebSocketMonitor.mjs"
import { JsonFileRegistryPersistence } from "../Core/Registry/Persistence/JsonFileRegistryPersistence.mjs"



export class Pendulum {

	protected machineRunners: Map<string, MachineRunner>
	protected machineCollection!: MachineCollection
	protected consoleMonitor: ConsoleMonitor
	protected webSocketMonitor: WebSocketMonitor
	protected registryPersistence: JsonFileRegistryPersistence
	protected library!: Library<GenericMachine>
	protected uidGenerator: UidGenerator

	protected runnerIds: Array<string>
	public constructor() {

		this.runnerIds = ['electricity', 'pressure', 'chemistry', 'mechanics']
		this.machineRunners = new Map()
		this.uidGenerator = new UidGenerator()
		this.consoleMonitor = new ConsoleMonitor()
		this.consoleMonitor.start()
		this.webSocketMonitor = new WebSocketMonitor()
		this.webSocketMonitor.start()
		this.registryPersistence = new JsonFileRegistryPersistence(
			resolve(fileURLToPath(import.meta.url), '../../../persistence')
		)
		this.registryPersistence.start()

		this.init()
	}

	protected async init(): Promise<void> {
		console.log('Pendulum init...')

		const projectRoot = resolve(fileURLToPath(import.meta.url), '../../..')
		const persistency = await MachinesPersistencyYaml.create(resolve(projectRoot, 'machines.yaml'))
		this.library = await Library.create(resolve(projectRoot, 'dist/Machinarium'), GenericMachine)

		this.machineCollection = await MachineCollection.create(persistency, this.library, this.registryPersistence)

		this.uidGenerator.seed(this.machineCollection.debugGetAllMachines().map(([uid]) => uid))

		for (const runnerName of this.runnerIds) {
			await this.createRunner(runnerName)
		}
	}

	protected async createRunner(runnerUid: string): Promise<void> {
		console.log('creating runner: ', runnerUid)
		const runner = await MachineRunner.create()
		runner.registerMachines(this.machineCollection.getMachines(runnerUid))

		this.machineRunners.set(runnerUid, runner)
	}

	/** Returns all registered machine runners keyed by their UID */
	public getRunners(): Map<string, MachineRunner> {
		return this.machineRunners
	}

	/** Returns a basic status snapshot */
	public getStatus() {
		return {
			date: 'now',
			status: 'ok'
		}
	}

	/** Writes a user-configurable setting on the given machine; returns the previous value or Err */
	public configureMachine(machineUid: string, settingName: string, value: TCellValue): Result<TCellValue | null, string> {
		return flatMap(
			this.machineCollection.getMachine(machineUid),
			machine => machine.registry.userWrite(settingName as TCellId, value)
		)
	}

	/** Reads a setting value from the given machine; returns the value or Err */
	public readMachineSetup(machineUid: string, settingName: string): Result<TCellValue | null, string> {
		return flatMap(
			this.machineCollection.getMachine(machineUid),
			machine => machine.registry.userRead(settingName as TCellId)
		)
	}

	/** Returns all registry cells for the given machine with their metadata */
	public getMachineCells(machineUid: string): Result<TRegistryCell[], string> {
		return flatMap(
			this.machineCollection.getMachine(machineUid),
			machine => ok(machine.registry.listCells())
		)
	}

	/** Returns a single registry cell with metadata for the given machine */
	public getMachineCell(machineUid: string, cellId: string): Result<TRegistryCell | undefined, string> {
		return flatMap(
			this.machineCollection.getMachine(machineUid),
			machine => ok(machine.registry.getCell(cellId as TCellId))
		)
	}

	/** Returns the names of all machine types available in the library */
	public listMachineTypes(): string[] {
		return this.library.listItems()
	}

	/** Creates a new machine, generates its UID server-side, registers it in the collection and the target runner */
	public async createMachine(params: TCreateMachineParams): Promise<Result<string, string>> {
		const runner = this.machineRunners.get(params.runner)
		if (!runner) return err(`Runner not found: ${params.runner}`)

		const MachineClass = this.library.getItem(params.library)
		const typeCode = (MachineClass as unknown as { typeCode?: string })?.typeCode ?? 'GENM'
		const uid = this.uidGenerator.generate(typeCode)

		const machine = await this.machineCollection.addMachine(
			{ uid, runner: params.runner, library: params.library, configuration: params.configuration ?? null },
			this.library,
			this.registryPersistence
		)
		runner.addMachine(machine)
		return ok(machine.uid)
	}

	/** Destroys and removes a machine from the collection and its runner */
	public deleteMachine(machineUid: string): Result<void, string> {
		const removeResult = this.machineCollection.removeMachine(machineUid)
		if (!removeResult.ok) return removeResult

		for (const runner of this.machineRunners.values()) {
			runner.removeMachine(machineUid)
		}

		return ok(undefined)
	}

	/** Returns all machines for debug purposes */
	public debugGetAllMachines() {
		return this.machineCollection.debugGetAllMachines()
	}

}
