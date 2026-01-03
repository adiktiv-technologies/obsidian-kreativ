/**
 * Web Worker - Runs in a separate thread to avoid blocking the main UI.
 * Abstract and payload-agnostic design for extensibility.
 */
import * as Comlink from "comlink"
import { WorkerAPI, WorkerHealthStatus } from "../../global"
import { generateWorkerId } from "../utils/ids"
import { SystemHealthUtil } from "../utils/system-health"
import { formatDuration } from "../utils/formatters"

/**
 * Registry of available getters for the generic get method.
 */
type GetterRegistry = {
	[key: string]: () => unknown
}

/**
 * WorkerService - The actual implementation exposed via Comlink.
 * Named to avoid confusion with the browser's native Worker class.
 */
class WorkerService implements WorkerAPI {
	private readonly workerId: string
	private readonly getters: GetterRegistry = {}

	constructor() {
		this.workerId = generateWorkerId()

		// Reset system health utility start time
		SystemHealthUtil.resetStartTime()
		console.debug(`[Worker] Initialized with ID: ${this.workerId}`)

		// Register available getters
		this.registerGetter("systemHealth", () => SystemHealthUtil.getSystemHealth())
		this.registerGetter("workerId", () => this.workerId)
		this.registerGetter("uptime", () => SystemHealthUtil.getUptime())
		this.registerGetter("uptimeFormatted", () => formatDuration(SystemHealthUtil.getUptime()))
	}

	/**
	 * Simple health check - verifies worker is running.
	 */
	async ping(): Promise<WorkerHealthStatus> {
		return {
			isRunning: true,
			timestamp: Date.now(),
			workerId: this.workerId,
		}
	}

	/**
	 * Generic getter method - payload-agnostic way to retrieve data.
	 * @param key - The key identifying what data to retrieve
	 * @returns The requested data or undefined if key not found
	 */
	async get<T = unknown>(key: string): Promise<T | undefined> {
		const getter = this.getters[key]
		if (getter) {
			return getter() as T
		}
		console.warn(`[Worker] Unknown getter key: ${key}`)
		return undefined
	}

	/**
	 * Register a new getter dynamically.
	 * @param key - The key to register
	 * @param getter - The function that returns the data
	 */
	registerGetter(key: string, getter: () => unknown): void {
		this.getters[key] = getter
	}

	/**
	 * Get list of available getter keys.
	 */
	async getAvailableKeys(): Promise<string[]> {
		return Object.keys(this.getters)
	}

	/**
	 * Graceful termination handler.
	 */
	async terminate(): Promise<void> {
		console.debug(`[Worker] Terminating worker: ${this.workerId}`)
		// Cleanup resources here when needed
	}
}

// Create worker instance and expose via Comlink.
// This file is bundled separately and loaded as a Web Worker blob.
const workerInstance = new WorkerService()
Comlink.expose(workerInstance)
