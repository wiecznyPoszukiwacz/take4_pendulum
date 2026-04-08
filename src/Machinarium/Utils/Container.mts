import { TCellId, TCellValue } from "#types"
import { Registry } from "../../Core/Registry/Registry.mjs"

export class Container {

	protected registry: Registry
	protected key: TCellId

	public currentValue: number = 0
	public maxValue: number = 100

	public constructor(registry: Registry, key: TCellId) {

		this.registry = registry
		this.key = key

		const result = registry.machineRead(key)
		if (result.ok && typeof result.value === 'number') {
			this.currentValue = result.value as number
		}
	}

	public accept(value: number) {
		this.currentValue += value
		this.currentValue = Math.min(this.currentValue, this.maxValue)
		this.updateRegistry()
	}

	protected updateRegistry() {
		this.registry.machineWrite(this.key, this.currentValue as TCellValue)
	}
}
