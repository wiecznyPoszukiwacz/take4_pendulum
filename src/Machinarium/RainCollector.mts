import { GenericMachine } from "#genericMachine";
import { TCellId, TCellValue } from "#types";
import { Container } from "./Utils/Container.mjs";

export class RainCollector extends GenericMachine {

	public static override readonly typeCode = 'RAIN'

	protected collectedWater: number = 0
	protected container!: Container

	protected onCreate(): void {
		this.registry.registerSetting('collectedWater' as TCellId, { initialValue: 0 as TCellValue })

		console.log('onCreate w rain collector')
		this.container = new Container(this.registry, 'collectedWater' as TCellId)
	}


	protected override onTick(ticks: number, timeElapsed: number): void {

		this.container.accept(5)

	}

}
