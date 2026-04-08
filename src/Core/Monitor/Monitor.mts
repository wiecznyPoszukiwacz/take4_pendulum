import { RegistryEventAggregator } from "../Registry/RegistryEventAggregator.mjs"
import type { TRegistryEvent } from "#types"

/** Abstract base class for registry event monitors; handles subscription lifecycle */
export abstract class Monitor {

	private unsubscribe: (() => void) | null = null

	/** Starts listening to registry events */
	public start(): void {
		if (this.unsubscribe) return
		this.unsubscribe = RegistryEventAggregator.getInstance().subscribe((event: TRegistryEvent) => {
			this.onEvent(event)
		})
	}

	/** Stops listening to registry events */
	public stop(): void {
		this.unsubscribe?.()
		this.unsubscribe = null
	}

	/** Called for each incoming registry event; implement in subclasses */
	protected abstract onEvent(event: TRegistryEvent): void

}
