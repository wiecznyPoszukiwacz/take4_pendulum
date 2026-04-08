import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { type Result, flatMap } from "../utils/Result.mjs"
import { type TCellId, type TCellValue } from "#types"
import { MachineCollection } from "../Core/StateMachines/Collections/Collection.mjs"
import { MachineRunner } from "../Core/StateMachines/Runners/GenericRunner.mjs"
import { Library } from "../Core/Utils/Library.mjs"
import { MachinesPersistencyYaml } from "../Core/Persistency/MachinesPersistency.mjs"
import { GenericMachine } from "../Core/StateMachines/Machines/GenericMachine.mjs"
import { ConsoleMonitor } from "../Core/Monitor/ConsoleMonitor.mjs"
import { WebSocketMonitor } from "../Core/Monitor/WebSocketMonitor.mjs"
import { JsonFileRegistryPersistence } from "../Core/Registry/Persistence/JsonFileRegistryPersistence.mjs"



export class Pendulum {

	protected machineRunners: Map<string, MachineRunner>
	protected machineCollection!: MachineCollection
	protected consoleMonitor: ConsoleMonitor
	protected webSocketMonitor: WebSocketMonitor
	protected registryPersistence: JsonFileRegistryPersistence

	protected runnerIds: Array<string>
	public constructor() {

		this.runnerIds = ['electricity', 'pressure', 'chemistry', 'mechanics']
		this.machineRunners = new Map()
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
		const library = await Library.create(resolve(projectRoot, 'dist/Machinarium'), GenericMachine)

		this.machineCollection = await MachineCollection.create(persistency, library, this.registryPersistence)

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

	/** Returns all machines for debug purposes */
	public debugGetAllMachines() {
		return this.machineCollection.debugGetAllMachines()
	}

}
