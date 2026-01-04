/**
 * Global type declarations for Kreativ plugin
 */

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
 * Sentiment analysis result.
 */
export interface SentimentResult {
	label: string
	score: number
}

/**
 * Model loading progress event from HuggingFace transformers.
 * Status flow: initiate → download → progress (0-100%) → done → ready
 */
export type ModelProgressStatus = "initiate" | "download" | "progress" | "done" | "ready"

export interface ModelProgressEvent {
	status: ModelProgressStatus
	name: string           // Model name, e.g. "Xenova/distilbert-base-uncased-finetuned-sst-2-english"
	file?: string          // File being downloaded, e.g. "onnx/model.onnx"
	task?: string          // Task type, e.g. "text-classification" (only on "ready")
	model?: string         // Model name (only on "ready")
	progress?: number      // 0-100 percentage (only on "progress")
	loaded?: number        // Bytes loaded (only on "progress")
	total?: number         // Total bytes (only on "progress")
}

/**
 * Aggregated progress state sent to main thread.
 */
export interface ModelLoadProgress {
	type: "model-progress"   // Discriminator for postMessage
	workerName?: string      // Worker name (added by pool)
	modelName: string
	overallProgress: number  // 0-100 aggregated across all files
	currentFile: string | null
	fileProgress: number     // 0-100 for current file
	status: "loading" | "ready" | "error"
	message: string          // Human-readable status
}

/**
 * Model types that can be loaded by the worker.
 */
export type ModelType = "sentiment" | "translation" | "rephrasing"

/**
 * Worker API exposed via Comlink.
 */
export interface WorkerAPI {
	ping(): Promise<WorkerHealthStatus>
	warmup(models: ModelType[]): Promise<void>
	sentiment(text: string): Promise<SentimentResult>
	isModelLoaded(model: ModelType): Promise<boolean>
	getSystemHealth(): Promise<SystemHealth>
	getUptime(): Promise<number>
	getUptimeFormatted(): Promise<string>
	terminate(): Promise<void>
}
