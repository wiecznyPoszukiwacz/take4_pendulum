import type { TRegistryEvent } from "#types"

type TSubscriber = (event: TRegistryEvent) => void

/** Singleton aggregator collecting registry change events from all machines */
export class RegistryEventAggregator {

	private static instance: RegistryEventAggregator | null = null
	private subscribers: Array<TSubscriber> = []

	private constructor() {}

	/** Returns the shared singleton instance, creating it on first call */
	public static getInstance(): RegistryEventAggregator {
		if (!RegistryEventAggregator.instance) {
			RegistryEventAggregator.instance = new RegistryEventAggregator()
		}
		return RegistryEventAggregator.instance
	}

	/** Dispatches an event to all current subscribers */
	public emit(event: TRegistryEvent): void {
		for (const subscriber of this.subscribers) {
			try {
				subscriber(event)
			} catch (e) {
				console.error('[RegistryEventAggregator] subscriber threw:', e)
			}
		}
	}

	/** Registers a callback and returns an unsubscribe function */
	public subscribe(callback: TSubscriber): () => void {
		this.subscribers.push(callback)
		return () => {
			this.subscribers = this.subscribers.filter(s => s !== callback)
		}
	}

}
