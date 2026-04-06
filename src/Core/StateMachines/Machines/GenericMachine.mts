import { Registry } from "../../Registry/Registry.mjs"

export class GenericMachine {

	#uid: string = ''
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
		this.registry = new Registry()
		this.registry.onUserWrite(this.updateConfig.bind(this))
		this.configuration = configuration
		// Do not call onCreate() here — subclass class fields are not yet initialized at this point
	}

	/** Calls onCreate(); must be invoked by the factory after construction so subclass fields are ready */
	public init(): void {
		this.onCreate()
	}

	protected onCreate() {

	}

	protected updateConfig(name: string, value: unknown, oldValue: unknown) {
	}


	public tick(timeElapsed: number = 1) {
		this.ticksElapsed++
		this.timeElapsed += timeElapsed

		this.onTick(1, timeElapsed)
	}

	protected onTick(ticks: number, timeElapsed: number) { }

	public debugStatus() {
		return {
			uid: this.#uid
		}
	}

}
