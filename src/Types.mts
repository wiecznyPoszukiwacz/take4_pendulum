declare const brand: unique symbol;
type Brand<T, B> = T & { readonly [brand]: B };

export type TCellId = Brand<string, 'TCellId'>
export type TCellValue = Brand<boolean | number | string | null, 'TCellValue'>

export type TRegistryCell = {
	name: TCellId,
	value: TCellValue | null,
	userWritable: boolean
}

/** Indicates whether the change originated from the machine itself or from a user action */
export type TRegistryEventSource = 'machine' | 'user'

/** Event emitted by a Registry whenever a cell value changes */
export type TRegistryEvent = {
	machineUid: string,
	cellId: TCellId,
	newValue: TCellValue | null,
	oldValue: TCellValue | null,
	source: TRegistryEventSource
}
