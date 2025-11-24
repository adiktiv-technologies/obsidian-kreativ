import { Notice } from "obsidian";
import { pipeline, env, type PipelineType } from "@huggingface/transformers";

export interface ModelConfig {
	task: PipelineType;
	modelId: string;
}

export interface ModelLoadOptions {
	progressCallback?: (data: any) => void;
}

type ModelState =
	| { status: "loading" }
	| { status: "loaded"; pipeline: any }
	| { status: "error"; error: Error };

export class ModelManager {
	private models: Map<string, ModelState> = new Map();

	constructor(cacheDir: string) {
		env.cacheDir = cacheDir;
		env.useFSCache = true;
		env.useBrowserCache = false;
		env.allowRemoteModels = true;
		env.backends.onnx = { device: "cpu" };
		env.backends.onnx.logLevel = "error";
	}

	async loadModel(config: ModelConfig, options?: ModelLoadOptions): Promise<unknown> {
		const modelKey = `${config.task}:${config.modelId}`;

		if (this.isModelLoading(modelKey)) {
			return null;
		}

		if (this.hasModel(modelKey)) {
			return this.getModel(modelKey);
		}

		this.models.set(modelKey, { status: "loading" });

		try {
			new Notice(`⏳ Loading ${config.task} model…`, 8000);

			const loadedPipeline = await pipeline(
				config.task,
				config.modelId,
				{
					progress_callback: options?.progressCallback,
					dtype: "fp32"
				}
			);

			this.models.set(modelKey, { status: "loaded", pipeline: loadedPipeline });
			new Notice(`✅ ${config.task} model ready!`, 3000);

			return loadedPipeline;
		} catch (error) {
			const err = error instanceof Error ? error : new Error(String(error));
			this.models.set(modelKey, { status: "error", error: err });
			this.handleLoadError(error, modelKey);
			throw error;
		}
	}

	getModel(modelKey: string): any | null {
		const state = this.models.get(modelKey);
		return state?.status === "loaded" ? state.pipeline : null;
	}

	hasModel(modelKey: string): boolean {
		const state = this.models.get(modelKey);
		return state?.status === "loaded";
	}

	isModelLoading(modelKey: string): boolean {
		const state = this.models.get(modelKey);
		return state?.status === "loading";
	}

	unloadModel(modelKey: string): void {
		const state = this.models.get(modelKey);
		if (state?.status === "loaded" && state.pipeline?.dispose) {
			try {
				state.pipeline.dispose();
			} catch (error) {
				console.error(`Failed to dispose model ${modelKey}:`, error);
			}
		}
		this.models.delete(modelKey);
	}

	unloadAllModels(): void {
		for (const [key, state] of this.models.entries()) {
			if (state.status === "loaded" && state.pipeline?.dispose) {
				try {
					state.pipeline.dispose();
				} catch (error) {
					console.error(`Failed to dispose model ${key}:`, error);
				}
			}
		}
		this.models.clear();
	}

	private handleLoadError(error: unknown, modelKey: string): void {
		const errorMessage = error instanceof Error ? error.message : "unknown";
		new Notice(`❌ Model load error: ${errorMessage}`, 6000);
	}
}
