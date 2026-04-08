#!/usr/bin/env node

/**
 * Basic WebSocket client for the Pendulum registry event monitor.
 * Connects to ws://localhost:8004 and prints incoming events to the console.
 *
 * Usage: node tools/ws-client.mjs
 */

import { WebSocket } from "ws"

const WS_URL = "ws://localhost:8004"
const RECONNECT_DELAY_MS = 3000

/** Connects to the WebSocket server and sets up event handlers */
function connect() {
	console.log(`Connecting to ${WS_URL}...`)
	const ws = new WebSocket(WS_URL)

	ws.on("open", () => {
		console.log("Connected. Waiting for registry events...\n")
	})

	ws.on("message", (data) => {
		const event = JSON.parse(data.toString())
		console.log(
			`[${event.source.toUpperCase()}] ${event.machineUid} | ${event.cellId}: ${event.oldValue} → ${event.newValue}`
		)
	})

	ws.on("close", () => {
		console.log(`\nDisconnected. Reconnecting in ${RECONNECT_DELAY_MS / 1000}s...`)
		setTimeout(connect, RECONNECT_DELAY_MS)
	})

	ws.on("error", (err) => {
		console.error("Connection error:", err.message)
	})
}

connect()
