# Changelog

## [1.10.0] - 2026-04-08

### Added
- `UidGenerator` (`src/Core/Utils/UidGenerator.mts`) — generates machine UIDs in `MCH-{XXXX}-{YYY}` format (4-letter typeCode + 3-char base62 counter, up to 238 328 per type); `seed()` initialises counters from existing UIDs on startup
- `GenericMachine.typeCode` — static `'GENM'`; each subclass overrides with a 4-letter code
- `RainCollector.typeCode` — static `'RAIN'`
- `TCreateMachineParams` in `src/Core/Persistency/types.mts` — create request type without `uid`

### Changed
- `Pendulum` holds `UidGenerator`; seeds it from existing machine UIDs after YAML load
- `Pendulum.createMachine()` accepts `TCreateMachineParams` (no `uid`); derives typeCode from library class, generates UID automatically
- `ApiHandler.createMachine` no longer accepts `uid` in params
- `rpcoon/createMachine.rpcon.yaml` — removed `uid` from example

## [1.9.0] - 2026-04-08

### Added
- `Library.listItems()` — returns names of all registered machine classes
- `MachineCollection.addMachine()` — public (formerly `protected createMachine()`); creates and registers a machine at runtime
- `MachineCollection.removeMachine(uid)` — destroys a machine, removes it from the internal map and runner mapping
- `MachineRunner.addMachine(machine)` — registers a single machine at runtime
- `MachineRunner.removeMachine(uid)` — removes a machine from the runner by UID
- `Pendulum.listMachineTypes()` — returns available machine class names from the library
- `Pendulum.createMachine(config)` — creates and registers a machine in the collection and its target runner; returns `Result<uid, string>`
- `Pendulum.deleteMachine(uid)` — destroys and removes a machine from collection and all runners; returns `Result<void, string>`
- JSON-RPC method `listMachineTypes` — lists all available machine class names
- JSON-RPC method `createMachine({ uid, runner, library, configuration? })` — creates a new machine at runtime
- JSON-RPC method `deleteMachine({ machineUid })` — destroys and removes a machine at runtime

### Changed
- `Pendulum` stores `library` as a field so it can be reused for runtime machine creation
- `MachineCollection.createMachine()` renamed to `addMachine()` and made `public`

## [1.8.0] - 2026-04-08

### Added
- `Registry.listCells()` — public method returning all registered cells with their current values and metadata (`typeRules`, `userWritable`)
- `Registry.getCell(name)` — public method returning a single cell by name, or `undefined` if not registered
- `Pendulum.getMachineCells(machineUid)` — returns `Result<TRegistryCell[], string>` for the given machine
- `Pendulum.getMachineCell(machineUid, cellId)` — returns `Result<TRegistryCell | undefined, string>` for a single cell
- JSON-RPC method `listCells({ machineUid })` — lists all registry cells for a machine with full metadata
- JSON-RPC method `getCell({ machineUid, cellId })` — returns a single cell with metadata, or `null` if not found
- JSON-RPC method `setCell({ machineUid, cellId, value })` — writes a value via `userWrite`; returns `{ previous }` or RPC error on read-only/validation failure
- JSON-RPC method `getMachineSnapshot({ machineUid })` — returns `{ uid, cells }` snapshot of the entire machine registry

## [1.7.0] - 2026-04-08

### Added
- `TCellTypeRules` — discriminated union in `Types.mts` describing per-cell validation rules: `boolean`, `number` (with optional `min`/`max`), `string` (with optional `minLength`, `maxLength`, `pattern`)
- `TCellOptions` — options object type replacing positional params in `registerSetting()`
- `Registry.validate()` — private method checking a `TCellValue` against `TCellTypeRules`; used at registration and on every `write()`

### Changed
- `TRegistryCell` extended with optional `typeRules?: TCellTypeRules`
- `Registry.registerSetting()` signature changed from `(name, userWritable, initialValue)` to `(name, options: TCellOptions)`; throws `Error` at startup if `initialValue` fails `typeRules` validation
- `Registry.write()` now validates the incoming value against `cell.typeRules` and returns `Err` if validation fails (affects both `machineWrite` and `userWrite`)
- `RainCollector.onCreate()` updated to use new `registerSetting` options-object API

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
