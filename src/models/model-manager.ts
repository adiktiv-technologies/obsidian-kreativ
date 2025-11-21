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
		const modelKey = this.buildModelKey(config);

		if (this.isModelLoading(modelKey) && !forceReload) {
			return null;
		}

		this.loadingStates.set(modelKey, true);

		try {
			if (forceReload) {
				this.unloadModel(modelKey);
			}

			if (this.hasModel(modelKey)) {
				return this.getModel(modelKey);
			}

			this.configureEnvironment(config.cacheDir);

			new Notice(`⏳ Loading ${config.task} model…`, 8000);

			const loadedPipeline = await pipeline(config.task, config.modelId, {
				progress_callback: options?.progressCallback,
			});

			this.loadedModels.set(modelKey, loadedPipeline);
			new Notice(`✅ ${config.task} model ready!`, 3000);

			return loadedPipeline;
		} catch (error) {
			this.handleLoadError(error, modelKey);
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
		}
		this.clearModuleCache();
	}

	unloadAllModels(): void {
		this.loadedModels.clear();
		this.loadingStates.clear();
	}

	getLoadedModels(): string[] {
		return Array.from(this.loadedModels.keys());
	}

	private buildModelKey(config: ModelConfig): string {
		return `${config.task}:${config.modelId}`;
	}

	private configureEnvironment(cacheDir: string): void {
		env.cacheDir = cacheDir;
		env.useFSCache = true;
		env.useBrowserCache = false;
		env.allowRemoteModels = true;
		env.backends.onnx = { device: "cpu" };
	}

	private handleLoadError(error: unknown, modelKey: string): void {
		const errorMessage = error instanceof Error ? error.message : "unknown";
		new Notice(`❌ Model load error: ${errorMessage}`, 6000);
	}

	private clearModuleCache(): void {
		try {
			const modulePath = require.resolve("@huggingface/transformers");
			delete require.cache[modulePath];
		} catch {

		}
	}
}
