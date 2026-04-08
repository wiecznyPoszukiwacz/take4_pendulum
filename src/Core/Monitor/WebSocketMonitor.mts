import { WebSocketServer, WebSocket } from "ws"
import { Monitor } from "./Monitor.mjs"
import type { TRegistryEvent } from "#types"

const WS_PORT = 8004

/** Monitor that broadcasts registry change events as JSON to all connected WebSocket clients */
export class WebSocketMonitor extends Monitor {

	private server: WebSocketServer

	public constructor() {
		super()
		this.server = new WebSocketServer({ port: WS_PORT })
		console.log(`[WebSocketMonitor] listening on ws://localhost:${WS_PORT}`)
	}

	protected onEvent(event: TRegistryEvent): void {
		const payload = JSON.stringify(event)
		for (const client of this.server.clients) {
			if (client.readyState === WebSocket.OPEN) {
				client.send(payload)
			}
		}
	}

	/** Closes the WebSocket server and stops listening */
	public override stop(): void {
		super.stop()
		this.server.close()
	}

}
