# Changelog

## [1.6.0] - 2026-04-08

### Added
- `RegistryPersistence` — abstract base class in `src/Core/Registry/Persistence/`; handles subscription lifecycle via `start()` / `stop()` using `RegistryEventAggregator`
- `JsonFileRegistryPersistence` — concrete implementation writing one JSON snapshot per machine to `persistence/{machineUid}.json`; reads persisted values on startup
- `Registry.initPersistence()` — loads saved cell values before machine calls `registerSetting()`; persisted value takes priority over `initialValue`
- `Pendulum` creates and starts `JsonFileRegistryPersistence` (directory: `persistence/`) before machine initialization

### Changed
- `GenericMachine.init()` is now `async`; accepts optional `RegistryPersistence` parameter and loads persistence before `onCreate()`
- `MachineCollection.create()` and `createMachine()` accept optional `RegistryPersistence` and forward it to `GenericMachine.init()`

## [1.5.0] - 2026-04-08

### Added
- `WebSocketMonitor` — broadcasts registry events as JSON to all connected WebSocket clients on port 8004
- `tools/ws-client.mjs` — basic WebSocket client that prints incoming registry events; reconnects automatically on disconnect
- `ws` runtime dependency, `@types/ws` dev dependency
- `Pendulum` starts `WebSocketMonitor` alongside `ConsoleMonitor`

## [1.4.0] - 2026-04-08

### Added
- `Monitor` — abstract base class in `src/Core/Monitor/`; manages subscription lifecycle via `start()` / `stop()`
- `ConsoleMonitor` — logs all registry change events to the console
- `Pendulum` creates and starts `ConsoleMonitor` before machine initialization

### Changed
- `RegistryEventAggregator` — singleton collecting change events from all machine registries; provides `subscribe()` returning an unsubscribe function
- `TRegistryEvent`, `TRegistryEventSource` types in `Types.mts`
- `GenericMachine.onRegistryChange()` — hook called on every registry cell change for the machine's own cells
- `GenericMachine.destroy()` — unsubscribes from the aggregator

### Changed
- `Registry` constructor now requires `machineUid: string`; emits events to `RegistryEventAggregator` on both `machineWrite` and `userWrite`
- `Registry` — removed `onUserWrite()` / `userWriteCbk`; replaced by aggregator subscription
- `GenericMachine` — subscribes to `RegistryEventAggregator` in `init()` instead of using `onUserWrite`; removed `updateConfig()`

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
