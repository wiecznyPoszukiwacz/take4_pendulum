import { readFile } from 'node:fs/promises'
import { parse } from 'yaml'
import type { TMachineConfig, TMachinesFile } from './types.mjs'

export class MachinesPersistencyYaml {

	private readonly filePath: string

	/** Creates a new instance pointing at the given YAML file path */
	public static async create(filePath: string): Promise<MachinesPersistencyYaml> {
		return new MachinesPersistencyYaml(filePath)
	}

	private constructor(filePath: string) {
		this.filePath = filePath
	}

	/** Reads and parses the YAML file, returning the list of machine configurations */
	public async load(): Promise<Array<TMachineConfig>> {
		const raw = await readFile(this.filePath, 'utf-8')
		const parsed = parse(raw) as TMachinesFile
		return parsed.machines
	}

}
