/** Represents a successful result containing a value of type T */
export type Ok<T> = { readonly ok: true; readonly value: T };

/** Represents a failed result containing an error of type E */
export type Err<E> = { readonly ok: false; readonly error: E };

/** A discriminated union representing either success (Ok<T>) or failure (Err<E>) */
export type Result<T, E> = Ok<T> | Err<E>;

/** Creates a successful Result wrapping the given value */
export function ok<T>(value: T): Ok<T> {
	return { ok: true, value };
}

/** Creates a failed Result wrapping the given error */
export function err<E>(error: E): Err<E> {
	return { ok: false, error };
}

/** Returns true if the result is Ok */
export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
	return result.ok === true;
}

/** Returns true if the result is Err */
export function isErr<T, E>(result: Result<T, E>): result is Err<E> {
	return result.ok === false;
}

/** Unwraps the value from Ok, or throws if the result is Err */
export function unwrap<T, E>(result: Result<T, E>): T {
	if (result.ok) return result.value;
	throw new Error(`Unwrap called on Err: ${String(result.error)}`);
}

/** Unwraps the value from Ok, or returns the provided fallback value */
export function unwrapOr<T, E>(result: Result<T, E>, fallback: T): T {
	return result.ok ? result.value : fallback;
}

/** Transforms the Ok value with a mapping function, leaving Err unchanged */
export function map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
	return result.ok ? ok(fn(result.value)) : result;
}

/** Transforms the Err value with a mapping function, leaving Ok unchanged */
export function mapErr<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
	return result.ok ? result : err(fn(result.error));
}

/** Chains a Result-returning function onto an Ok value; passes Err through unchanged */
export function flatMap<T, U, E>(result: Result<T, E>, fn: (value: T) => Result<U, E>): Result<U, E> {
	return result.ok ? fn(result.value) : result;
}

/** Wraps a throwing function call in a Result, catching any thrown error */
export function tryCatch<T>(fn: () => T): Result<T, unknown> {
	try {
		return ok(fn());
	} catch (e) {
		return err(e);
	}
}

/** Wraps an async throwing function call in a Result, catching any rejected error */
export async function tryCatchAsync<T>(fn: () => Promise<T>): Promise<Result<T, unknown>> {
	try {
		return ok(await fn());
	} catch (e) {
		return err(e);
	}
}
