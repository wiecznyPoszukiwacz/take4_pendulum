import { Monitor } from "./Monitor.mjs"
import type { TRegistryEvent } from "#types"

/** Monitor that logs all registry change events to the console */
export class ConsoleMonitor extends Monitor {

	protected onEvent(event: TRegistryEvent): void {
		console.log(
			`[Registry] ${event.machineUid} | ${event.cellId}: ${event.oldValue} → ${event.newValue} (${event.source})`
		)
	}

}
