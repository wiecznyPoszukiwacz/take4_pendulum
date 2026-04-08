import { RegistryEventAggregator } from "../RegistryEventAggregator.mjs"
import type { TCellId, TCellValue, TRegistryEvent } from "#types"

/** Abstract base class for registry state persistence; handles subscription lifecycle */
export abstract class RegistryPersistence {

	private unsubscribe: (() => void) | null = null

	/** Starts persisting registry changes by subscribing to all registry events */
	public start(): void {
		if (this.unsubscribe) return
		this.unsubscribe = RegistryEventAggregator.getInstance().subscribe((event: TRegistryEvent) => {
			this.onEvent(event)
		})
	}

	/** Stops persisting registry changes and unsubscribes from the event aggregator */
	public stop(): void {
		this.unsubscribe?.()
		this.unsubscribe = null
	}

	/** Loads persisted cell values for a specific machine; returns an empty Map if no data exists */
	public abstract loadMachine(machineUid: string): Promise<Map<TCellId, TCellValue | null>>

	/** Called for each incoming registry event; implement to persist the change */
	protected abstract onEvent(event: TRegistryEvent): void

}
