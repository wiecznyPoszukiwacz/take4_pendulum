declare const brand: unique symbol;
type Brand<T, B> = T & { readonly [brand]: B };

export type TCellId = Brand<string, 'TCellId'>
export type TCellValue = Brand<boolean | number | string | null, 'TCellValue'>

/** Validation rules for a registry cell, discriminated by value type */
export type TCellTypeRules =
  | { type: 'boolean' }
  | { type: 'number'; min?: number; max?: number }
  | { type: 'string'; minLength?: number; maxLength?: number; pattern?: string }

/** Options passed to registerSetting when declaring a registry cell */
export type TCellOptions = {
  userWritable?: boolean
  initialValue?: TCellValue | null
  typeRules?: TCellTypeRules
}

export type TRegistryCell = {
	name: TCellId,
	value: TCellValue | null,
	userWritable: boolean,
	typeRules?: TCellTypeRules
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
