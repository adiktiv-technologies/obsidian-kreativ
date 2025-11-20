import { Notice } from "obsidian";
import { pipeline, env, type PipelineType } from "@huggingface/transformers";

export interface ModelConfig {
	task: PipelineType;
	modelId: string;
	cacheDir: string;
}

export interface ModelLoadOptions {
	progressCallback?: (data: any) => void;
}

export class ModelManager {
	private loadedModels: Map<string, any> = new Map();
	private loadingStates: Map<string, boolean> = new Map();

	async loadModel(
		config: ModelConfig,
		options?: ModelLoadOptions,
		forceReload = false
	): Promise<any> {
		const modelKey = this.getModelKey(config);

		if (this.isModelLoading(modelKey) && !forceReload) {
			console.log(`⏳ Model ${modelKey} is already loading`);
			return null;
		}

		this.loadingStates.set(modelKey, true);

		try {
			if (forceReload) {
				this.unloadModel(modelKey);
			}

			if (this.hasModel(modelKey)) {
				console.log(`✅ Model ${modelKey} already loaded`);
				return this.getModel(modelKey);
			}

			// Configure environment for Node.js
			env.cacheDir = config.cacheDir;
			env.useFSCache = true;
			env.useBrowserCache = false;
			env.allowRemoteModels = true;
			env.backends.onnx = { device: "cpu" };

			new Notice(`⏳ Loading ${config.task} model…`, 8000);
			console.time(`Model load time: ${modelKey}`);

			const loadedPipeline = await pipeline(config.task, config.modelId, {
				progress_callback: options?.progressCallback,
			});

			this.loadedModels.set(modelKey, loadedPipeline);

			console.timeEnd(`Model load time: ${modelKey}`);
			new Notice(`✅ ${config.task} model ready!`, 3000);
			console.log(`✅ Pipeline initialized: ${modelKey}`);

			return loadedPipeline;
		} catch (error) {
			const message = error instanceof Error ? error.message : "unknown";
			console.error(`🔥 Fatal: Model loading failed for ${modelKey}`, error);
			new Notice(`❌ Model load error: ${message}`, 6000);

			if (message.includes("Module did not self-register")) {
				console.error("👉 Native module not rebuilt for Obsidian's Electron.");
				console.error(
					"👉 Run: npx electron-rebuild -v 30.1.0 -w onnxruntime-node"
				);
			}

			throw error;
		} finally {
			this.loadingStates.set(modelKey, false);
		}
	}

	getModel(modelKey: string): any | null {
		return this.loadedModels.get(modelKey) ?? null;
	}

	hasModel(modelKey: string): boolean {
		return this.loadedModels.has(modelKey);
	}

	isModelLoading(modelKey: string): boolean {
		return this.loadingStates.get(modelKey) ?? false;
	}

	unloadModel(modelKey: string): void {
		if (this.hasModel(modelKey)) {
			this.loadedModels.delete(modelKey);
			console.log(`🗑️ Unloaded model: ${modelKey}`);
		}

		// Clear module cache for force reload
		try {
			const modulePath = require.resolve("@huggingface/transformers");
			delete require.cache[modulePath];
		} catch (error) {
			// Ignore if module not found
		}
	}

	unloadAllModels(): void {
		this.loadedModels.clear();
		this.loadingStates.clear();
		console.log("🗑️ Unloaded all models");
	}

	getLoadedModels(): string[] {
		return Array.from(this.loadedModels.keys());
	}

	private getModelKey(config: ModelConfig): string {
		return `${config.task}:${config.modelId}`;
	}
}
