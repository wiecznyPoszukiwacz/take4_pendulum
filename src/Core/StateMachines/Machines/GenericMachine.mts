import { Registry } from "../../Registry/Registry.mjs"
import { RegistryEventAggregator } from "../../Registry/RegistryEventAggregator.mjs"
import type { TRegistryEvent } from "#types"
import type { RegistryPersistence } from "../../Registry/Persistence/RegistryPersistence.mjs"

export class GenericMachine {

	#uid: string = ''
	#unsubscribe: (() => void) | null = null
	protected ticksElapsed: number = 0
	protected timeElapsed: number = 0
	protected configuration: unknown
	public registry: Registry

	get uid() {
		return this.#uid
	}

	public static async create(uid: string, configuration: unknown) {
		const machine = new GenericMachine(uid, configuration)
		return machine
	}

	public constructor(uid: string, configuration: unknown) {
		this.#uid = uid
		this.registry = new Registry(uid)
		this.configuration = configuration
		// Do not call onCreate() here — subclass class fields are not yet initialized at this point
	}

	/** Calls onCreate() and subscribes to registry events; must be invoked by the factory after construction so subclass fields are ready */
	public async init(persistence?: RegistryPersistence): Promise<void> {
		if (persistence) {
			await this.registry.initPersistence(persistence)
		}
		this.#unsubscribe = RegistryEventAggregator.getInstance().subscribe((event: TRegistryEvent) => {
			if (event.machineUid === this.#uid) {
				this.onRegistryChange(event)
			}
		})
		this.onCreate()
	}

	/** Cancels the registry event subscription; call when the machine is no longer needed */
	public destroy(): void {
		this.#unsubscribe?.()
		this.#unsubscribe = null
	}

	protected onCreate() {}

	/** Called whenever any cell in this machine's registry changes */
	protected onRegistryChange(_event: TRegistryEvent): void {}

	public tick(timeElapsed: number = 1) {
		this.ticksElapsed++
		this.timeElapsed += timeElapsed

		this.onTick(1, timeElapsed)
	}

	protected onTick(_ticks: number, _timeElapsed: number) {}

	public debugStatus() {
		return {
			uid: this.#uid
		}
	}

}
