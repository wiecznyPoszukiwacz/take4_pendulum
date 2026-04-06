/** Configuration entry for a single machine loaded from YAML */
export type TMachineConfig = {
	uid: string
	runner: string
	library: string
	configuration: unknown
}

/** Root structure of the machines YAML file */
export type TMachinesFile = {
	machines: Array<TMachineConfig>
}
