import { GenericMachine } from "../Machines/GenericMachine.mjs";

export class MachineRunner {

	protected tickDelay: number = 5000
	protected ticksElapsed: number = 0
	protected timeElapsed: number = 0

	protected machines: Map<string, GenericMachine>

	protected constructor() {
		this.machines = new Map()
	}
	public static async create(): Promise<MachineRunner> {


		const runner = new MachineRunner();

		await runner.init();
		runner.run();

		return runner;
	}

	protected async init() { }

	public registerMachines(machines: Array<GenericMachine>) {
		machines.forEach(m => {
			this.machines.set(m.uid, m)
		})
	}

	public run() {

		setInterval(() => {
			this.tick()
		}, 5000)
	}

	public tick(timeElapsed = 1) {

		this.ticksElapsed++
		this.timeElapsed += timeElapsed

		this.machines.forEach(m => m.tick(timeElapsed))

	}

	public getStatus() {

		return {
			'status': 'ok',
			ticksElapsed: this.ticksElapsed,
			timeElapsed: this.timeElapsed
		}
	}

	public getMachines(): Map<string, GenericMachine> {
		return this.machines
	}



}
