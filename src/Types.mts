declare const brand: unique symbol;
type Brand<T, B> = T & { readonly [brand]: B };

export type TCellId = Brand<string, 'TCellId'>
export type TCellValue = Brand<boolean | number | string | null, 'TCellValue'>


export type TRegistryCell = {
	name: TCellId,
	value: TCellValue | null,
	userWritable: boolean
}
