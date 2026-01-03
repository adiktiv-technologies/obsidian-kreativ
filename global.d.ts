/**
 * Global type declarations for Kreativ plugin
 */

declare interface Pipeline {
	load(): Promise<void>
	unload(): void
	isReady(): boolean
	isLoadingModel(): boolean
}

/**
 * Health check response from the worker.
 */
export interface WorkerHealthStatus {
	isRunning: boolean
	timestamp: number
	workerId: string
}

/**
 * System health information.
 */
export interface SystemHealth {
	memoryUsage: {
		usedJSHeapSize?: number
		totalJSHeapSize?: number
		jsHeapSizeLimit?: number
	}
	timestamp: number
	workerUptime: number
}

/**
 * Interface for the worker API exposed via Comlink.
 * Abstract and payload-agnostic design for extensibility.
 */
export interface WorkerAPI {
	ping(): Promise<WorkerHealthStatus> 					// Simple health check to verify worker is running.
	get<T = unknown>(key: string): Promise<T | undefined> 	// Generic getter for any registered data.
	getAvailableKeys(): Promise<string[]> 					// List available getter keys.
	terminate(): Promise<void> 								// Gracefully terminate the worker.
}
