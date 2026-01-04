import * as Comlink from "comlink"
import { WorkerAPI, ModelLoadProgress } from "../../global"
import { withTimeout } from "../utils/async"

// Worker code is bundled separately by esbuild's inlineWorkerPlugin and imported as a string.
// The plugin bundles service.worker.ts with all dependencies into an IIFE string.
// @ts-ignore - Custom esbuild plugin returns string
import workerCode from "./service.worker.ts"

/** Callback type for progress events from workers */
export type ProgressCallback = (progress: ModelLoadProgress) => void

export class WorkerPool {
	private workers: Map<string, Comlink.Remote<WorkerAPI>> = new Map()
	private instances: Map<string, Worker> = new Map()
	private progressCallback: ProgressCallback | null = null

	/**
	 * Set a pool-wide progress callback for all workers.
	 * Progress events include workerName to identify the source.
	 */
	onProgress(callback: ProgressCallback | null): void {
		this.progressCallback = callback
	}

	/**
	 * Spawn a new worker instance.
	 * @param name - Unique name for this worker
	 */
	async spawn(name: string): Promise<Comlink.Remote<WorkerAPI>> {
		// If a worker with this name already exists, terminate it to avoid leaks.
		if (this.workers.has(name) || this.instances.has(name)) {
			await this.terminate(name)
		}

		// Create Blob from worker code string
		const blob = new Blob([workerCode], { type: 'application/javascript' })
		const workerUrl = URL.createObjectURL(blob)

		// Pass worker name for easier debugging in DevTools (Sources > Threads)
		const rawWorker: Worker = new Worker(workerUrl, { name: `kreativ-${name}` })

		// Listen for progress messages from the worker, tag with worker name
		rawWorker.addEventListener("message", (event: MessageEvent) => {
			// Filter for our custom progress messages (Comlink uses different structure)
			if (event.data?.type === "model-progress" && event.data?.payload) {
				if (this.progressCallback) {
					const progress = event.data.payload as ModelLoadProgress
					progress.workerName = name
					this.progressCallback(progress)
				}
			}
		})

		// Revoke blob URL immediately after worker creation to prevent memory leaks.
		// The worker has already loaded the code at this point.
		URL.revokeObjectURL(workerUrl)
		this.instances.set(name, rawWorker)

		// Wrap worker with Comlink
		const proxy = Comlink.wrap<WorkerAPI>(rawWorker)
		this.workers.set(name, proxy)

		// Wait for the worker to be ready with a timeout to prevent hanging on unresponsive workers
		try {
			await withTimeout(proxy.ping(), 5000, "Worker ping timeout")
		} catch (err) {
			// Clean up on failure
			rawWorker.terminate()
			this.workers.delete(name)
			this.instances.delete(name)
			throw err
		}

		// Return the Comlink proxy
		return proxy
	}

	/**
	 * Get a worker by name.
	 */
	get(name: string): Comlink.Remote<WorkerAPI> | undefined {
		return this.workers.get(name)
	}

	/**
	 * Terminate a specific worker.
	 */
	async terminate(name: string): Promise<void> {
		const proxy = this.workers.get(name)
		const raw = this.instances.get(name)

		if (proxy) {
			try {
				await withTimeout(proxy.terminate(), 5000, "Worker terminate timeout")
			} catch {
				// Graceful failed, force terminate below
			}
		}
		if (raw) {
			raw.terminate()
		}

		this.workers.delete(name)
		this.instances.delete(name)
	}

	/**
	 * Terminate all workers.
	 */
	async terminateAll(): Promise<void> {
		const names = [...this.workers.keys()]
		for (const name of names) {
			await this.terminate(name)
		}
	}
}
