import { readdir } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { Constructor } from './types.mjs'

export class Library<T> {

	private readonly items: Map<string, Constructor<T>>
	private readonly baseClass: { prototype: T }

	/** Creates a new Library by recursively scanning dirPath and loading all subclasses of baseClass */
	public static async create<T>(
		dirPath: string,
		baseClass: { prototype: T }
	): Promise<Library<T>> {
		const lib = new Library<T>(baseClass)
		await lib.scan(resolve(dirPath))
		return lib
	}

	private constructor(baseClass: { prototype: T }) {
		this.items = new Map()
		this.baseClass = baseClass
	}

	/** Recursively scans a directory and loads all .mjs files */
	private async scan(dirPath: string): Promise<void> {
		const entries = await readdir(dirPath, { withFileTypes: true })

		for (const entry of entries) {
			const fullPath = join(dirPath, entry.name)
			if (entry.isDirectory()) {
				await this.scan(fullPath)
			} else if (entry.isFile() && entry.name.endsWith('.mjs')) {
				await this.loadModule(fullPath)
			}
		}
	}

	/** Imports a module and registers any exported classes that extend baseClass */
	private async loadModule(filePath: string): Promise<void> {
		const module = await import(pathToFileURL(filePath).href) as Record<string, unknown>

		for (const value of Object.values(module)) {
			if (this.isSubclassOf(value)) {
				this.items.set((value as { name: string }).name, value)
			}
		}
	}

	/** Returns true if value is a constructor whose prototype chain includes baseClass */
	private isSubclassOf(value: unknown): value is Constructor<T> {
		if (typeof value !== 'function') return false
		if (value === (this.baseClass as unknown)) return false
		try {
			return (value as { prototype: unknown }).prototype instanceof (this.baseClass as unknown as new (...args: unknown[]) => T)
		} catch {
			return false
		}
	}

	/** Returns the constructor registered under the given class name, or undefined if not found */
	public getItem(name: string): Constructor<T> | undefined {
		return this.items.get(name)
	}

	/** Returns the names of all registered classes */
	public listItems(): string[] {
		return Array.from(this.items.keys())
	}

}
