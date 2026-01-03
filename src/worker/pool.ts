import * as Comlink from "comlink"
import { WorkerAPI } from "../../global"

// Worker code is bundled separately by esbuild's inlineWorkerPlugin and imported as a string.
// The plugin bundles service.worker.ts with all dependencies into an IIFE string.
// @ts-ignore - Custom esbuild plugin returns string
import workerCode from "./service.worker.ts"

export class WorkerPool {
	private workers: Map<string, Comlink.Remote<WorkerAPI>> = new Map()
	private instances: Map<string, Worker> = new Map()

	/**
	 * Spawn a new worker instance.
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
		this.instances.set(name, rawWorker)

		const proxy = Comlink.wrap<WorkerAPI>(rawWorker)
		this.workers.set(name, proxy)

		// Wait for the worker to be ready (simple ping)
		await proxy.ping()

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
				await Promise.race([
					proxy.terminate(),
					new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 5000))
				])
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
