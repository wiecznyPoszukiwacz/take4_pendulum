import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { RegistryPersistence } from "./RegistryPersistence.mjs"
import type { TCellId, TCellValue, TRegistryEvent } from "#types"

/** Persists registry state as JSON files on disk, one file per machine */
export class JsonFileRegistryPersistence extends RegistryPersistence {

	private readonly directory: string
	private readonly snapshots: Map<string, Record<string, TCellValue | null>>

	public constructor(directory: string) {
		super()
		this.directory = directory
		this.snapshots = new Map()
	}

	/** Loads persisted cell values from {directory}/{machineUid}.json; returns empty Map if file not found */
	public async loadMachine(machineUid: string): Promise<Map<TCellId, TCellValue | null>> {
		const filePath = join(this.directory, `${machineUid}.json`)
		try {
			const content = await readFile(filePath, 'utf-8')
			const data = JSON.parse(content) as Record<string, TCellValue | null>
			this.snapshots.set(machineUid, data)
			return new Map(Object.entries(data) as Array<[TCellId, TCellValue | null]>)
		} catch {
			return new Map()
		}
	}

	/** Updates the in-memory snapshot and writes it to disk; errors are logged but do not throw */
	protected onEvent(event: TRegistryEvent): void {
		const snapshot = this.snapshots.get(event.machineUid) ?? {}
		snapshot[event.cellId as string] = event.newValue
		this.snapshots.set(event.machineUid, snapshot)
		this.writeSnapshot(event.machineUid, snapshot).catch((e: unknown) => {
			console.error(`[JsonFileRegistryPersistence] Failed to write snapshot for ${event.machineUid}:`, e)
		})
	}

	/** Writes the current snapshot for a machine to {directory}/{machineUid}.json */
	private async writeSnapshot(machineUid: string, snapshot: Record<string, TCellValue | null>): Promise<void> {
		await mkdir(this.directory, { recursive: true })
		await writeFile(
			join(this.directory, `${machineUid}.json`),
			JSON.stringify(snapshot, null, 2),
			'utf-8'
		)
	}

}
