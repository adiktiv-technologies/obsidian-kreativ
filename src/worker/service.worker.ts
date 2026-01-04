/**
 * Web Worker - Runs in a separate thread to avoid blocking the main UI.
 */
import * as Comlink from "comlink"
import { WorkerAPI, WorkerHealthStatus, SentimentResult, ModelProgressEvent, ModelLoadProgress, ModelType } from "../../global"
import { generateWorkerId } from "../utils/ids"
import { SystemHealthUtil } from "../utils/system-health"
import { formatDuration } from "../utils/formatters"

/**
 * Type definitions for transformers.js runtime
 */
interface TransformersModule {
	pipeline: (task: string, model: string, options?: PipelineOptions) => Promise<SentimentClassifier>
}

interface PipelineOptions {
	dtype?: string
	device?: "wasm" | "webgpu"
	progress_callback?: (progress: ModelProgressEvent) => void
}

interface ClassifierOutput {
	label: string
	score: number
}

type SentimentClassifier = ((text: string) => Promise<ClassifierOutput | ClassifierOutput[]>) & {
	dispose?: () => Promise<void>
}

/**
 * Tracks progress across multiple files during model loading.
 * The main model file (onnx/model.onnx) dominates progress since it's ~99% of download size.
 */
class ModelProgressTracker {
	private files: Map<string, { loaded: number; total: number; done: boolean }> = new Map()
	private modelName: string = ""
	private currentFile: string | null = null

	/**
	 * Process a progress event from transformers.js and emit aggregated progress.
	 */
	handleProgress(event: ModelProgressEvent): void {
		this.modelName = event.name

		if (event.status === "initiate" && event.file) {
			this.files.set(event.file, { loaded: 0, total: 0, done: false })
			this.currentFile = event.file
			this.emit("loading", `Initializing ${this.getShortFileName(event.file)}...`)
		} else if (event.status === "progress" && event.file) {
			this.files.set(event.file, {
				loaded: event.loaded ?? 0,
				total: event.total ?? 0,
				done: false
			})
			this.currentFile = event.file
			this.emit("loading", `Downloading ${this.getShortFileName(event.file)}...`)
		} else if (event.status === "done" && event.file) {
			const fileInfo = this.files.get(event.file)
			if (fileInfo) {
				fileInfo.done = true
				fileInfo.loaded = fileInfo.total
			}
			this.emit("loading", `Completed ${this.getShortFileName(event.file)}`)
		} else if (event.status === "ready") {
			this.emit("ready", "Model ready")
		}
	}

	private emit(status: "loading" | "ready" | "error", message: string): void {
		const progress = this.calculateOverallProgress()
		const fileProgress = this.getCurrentFileProgress()

		const msg: ModelLoadProgress = {
			type: "model-progress",
			modelName: this.modelName,
			overallProgress: progress,
			currentFile: this.currentFile,
			fileProgress: fileProgress,
			status: status,
			message: message
		}

		// Post directly to main thread (Comlink uses same channel but this bypasses RPC)
		self.postMessage({ type: "model-progress", payload: msg })
	}

	private calculateOverallProgress(): number {
		let totalBytes = 0
		let loadedBytes = 0

		for (const file of this.files.values()) {
			totalBytes += file.total
			loadedBytes += file.loaded
		}

		if (totalBytes === 0) return 0
		return Math.round((loadedBytes / totalBytes) * 100)
	}

	private getCurrentFileProgress(): number {
		if (!this.currentFile) return 0
		const file = this.files.get(this.currentFile)
		if (!file || file.total === 0) return 0
		return Math.round((file.loaded / file.total) * 100)
	}

	private getShortFileName(file: string): string {
		// "onnx/model.onnx" → "model.onnx"
		return file.split("/").pop() ?? file
	}

	reset(): void {
		this.files.clear()
		this.currentFile = null
	}
}

/**
 * Dynamic import of transformers library with proper environment setup
 */
async function importTransformers(): Promise<TransformersModule> {
	// CRITICAL: Remove process object before loading transformers
	// Obsidian's Electron environment has a process object that makes
	// transformers.js think it's in Node.js, breaking browser ONNX runtime
	Object.defineProperty(globalThis, 'process', {
		get: () => undefined,
		configurable: true,
	});

	try {
		// @ts-expect-error - Dynamic import for transformers library
		return await import("@huggingface/transformers");
	} catch (error) {
		console.error('Failed to import transformers.js:', error);
		throw new Error(`Failed to load transformers library: ${error instanceof Error ? error.message : String(error)}`);
	}
}

/**
 * WorkerService - ML inference worker exposed via Comlink.
 */
class WorkerService implements WorkerAPI {
	private classifier: SentimentClassifier | null = null
	private classifierPromise: Promise<SentimentClassifier> | null = null
	private readonly workerId = generateWorkerId()
	private readonly progressTracker = new ModelProgressTracker()

	constructor() {
		SystemHealthUtil.resetStartTime()
	}

	/**
	 * Run sentiment analysis on text.
	 */
	async sentiment(text: string): Promise<SentimentResult> {
		const classifier = await this.getClassifier()
		const output = await classifier(text)
		const first = Array.isArray(output) ? output[0] : output
		if (!first || Array.isArray(first)) {
			return { label: "NEUTRAL", score: 0 }
		}
		return { label: String(first.label), score: Number(first.score) }
	}

	private async getClassifier(): Promise<SentimentClassifier> {
		if (this.classifier) return this.classifier

		if (!this.classifierPromise) {
			this.classifierPromise = (async () => {
				const transformers = await importTransformers()
				this.progressTracker.reset()
				return transformers.pipeline("sentiment-analysis", "Xenova/distilbert-base-uncased-finetuned-sst-2-english", {
					dtype: "fp32",
					device: "wasm",
					progress_callback: (event: ModelProgressEvent) => {
						this.progressTracker.handleProgress(event)
					}
				})
			})()
		}

		try {
			this.classifier = await this.classifierPromise
			return this.classifier
		} catch (error) {
			this.classifierPromise = null
			console.error("[Worker] Failed to load sentiment pipeline:", error)
			throw new Error(`Failed to load sentiment model: ${error instanceof Error ? error.message : String(error)}`)
		}
	}

	async ping(): Promise<WorkerHealthStatus> {
		return {
			isRunning: true,
			timestamp: Date.now(),
			workerId: this.workerId,
		}
	}

	/**
	 * Check if a specific model is loaded in memory.
	 */
	async isModelLoaded(model: ModelType): Promise<boolean> {
		switch (model) {
			case "sentiment":
				return this.classifier !== null
			case "translation":
			case "rephrasing":
				return false // Not implemented yet
			default:
				return false
		}
	}

	/**
	 * Preload selected models without running inference.
	 * Call this on startup when autoLoadModels is enabled.
	 * @param models - Array of model types to load based on enabled features
	 */
	async warmup(models: ModelType[]): Promise<void> {
		for (const model of models) {
			switch (model) {
				case "sentiment":
					await this.getClassifier()
					break
				case "translation":
					// TODO: await this.getTranslator()
					break
				case "rephrasing":
					// TODO: await this.getRephraser()
					break
			}
		}
	}

	async getSystemHealth() {
		return SystemHealthUtil.getSystemHealth()
	}

	async getUptime() {
		return SystemHealthUtil.getUptime()
	}

	async getUptimeFormatted() {
		return formatDuration(SystemHealthUtil.getUptime())
	}

	async terminate(): Promise<void> {
		if (this.classifier?.dispose) await this.classifier.dispose()
		this.classifier = null
		this.classifierPromise = null
	}
}

// Expose worker via Comlink
const workerInstance = new WorkerService()
Comlink.expose(workerInstance)
