import { Notice } from "obsidian";
import { ModelManager } from "./model-manager";

export interface SentimentResult {
	label: string;
	score: number;
}

export class SentimentPipeline {
	private static readonly MODEL_KEY = "sentiment-analysis:Xenova/distilbert-base-uncased-finetuned-sst-2-english";
	private static readonly MODEL_ID = "Xenova/distilbert-base-uncased-finetuned-sst-2-english";
	private static readonly TASK = "sentiment-analysis";

	private modelManager: ModelManager;
	private cacheDir = "";

	constructor(modelManager: ModelManager) {
		this.modelManager = modelManager;
	}

	async load(cacheDir: string, forceReload = false): Promise<void> {
		this.cacheDir = cacheDir;

		await this.modelManager.loadModel(
			{
				task: SentimentPipeline.TASK,
				modelId: SentimentPipeline.MODEL_ID,
				cacheDir,
			},
			{
				progressCallback: this.handleDownloadProgress.bind(this),
			},
			forceReload
		);
	}

	async analyze(text: string): Promise<SentimentResult | null> {
		const pipeline = this.modelManager.getModel(SentimentPipeline.MODEL_KEY);
		if (!pipeline) return null;

		try {
			const result = await pipeline(text);
			return result[0] as SentimentResult;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "unknown";
			throw new Error(`Inference error: ${errorMessage}`);
		}
	}

	isReady(): boolean {
		return this.modelManager.hasModel(SentimentPipeline.MODEL_KEY);
	}

	isLoadingModel(): boolean {
		return this.modelManager.isModelLoading(SentimentPipeline.MODEL_KEY);
	}

	unload(): void {
		this.modelManager.unloadModel(SentimentPipeline.MODEL_KEY);
	}

	private handleDownloadProgress(data: { status?: string; progress?: number; file?: string }): void {
		if (data.status === "downloading" && data.progress !== undefined) {
			const progress = data.progress.toFixed(1);
			new Notice(`📥 Downloading: ${data.file} (${progress}%)`, 3000);
		}
	}
}
