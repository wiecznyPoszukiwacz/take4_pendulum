# Changelog

## [1.2.0] - 2026-04-06

### Added
- `MachinesPersistencyYaml` — reads machine definitions from a YAML file (`machines.yaml`)
- `src/Core/Persistency/types.mts` — types `TMachineConfig` and `TMachinesFile`
- `machines.yaml` — machine configuration file in project root
- `yaml` runtime dependency for YAML parsing

### Changed
- `MachineCollection.create()` now accepts `MachinesPersistencyYaml` and `Library<GenericMachine>` instead of hardcoding machines
- `MachineCollection.createMachine()` uses `Library` to resolve the machine class dynamically; falls back to `GenericMachine` if class not found
- `GenericMachine` constructor changed from `protected` to `public` to allow instantiation via `Library<T>` (`Constructor<T>` type)
- `Pendulum.init()` creates `MachinesPersistencyYaml` and `Library`, then passes them to `MachineCollection.create()`
