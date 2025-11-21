import { Notice } from "obsidian";
import { ModelManager } from "./model-manager";

export interface SentimentResult {
	label: string;
	score: number;
}

export class SentimentPipeline {
	private static readonly MODEL_KEY = "sentiment-analysis:Xenova/distilbert-base-uncased-finetuned-sst-2-english";
	private static readonly MODEL_ID = "Xenova/distilbert-base-uncased-finetuned-sst-2-english";
	private modelManager: ModelManager;

	constructor(modelManager: ModelManager) {
		this.modelManager = modelManager;
	}

	async load(cacheDir: string, forceReload = false): Promise<void> {
		await this.modelManager.loadModel(
			{
				task: "sentiment-analysis",
				modelId: SentimentPipeline.MODEL_ID,
				cacheDir: cacheDir,
			},
			{
				progressCallback: this.handleDownloadProgress.bind(this),
			},
			forceReload
		);
	}

	async analyze(text: string): Promise<SentimentResult | null> {
		const pipeline = this.modelManager.getModel(SentimentPipeline.MODEL_KEY);

		if (!pipeline) {
			return null;
		}

		try {
			const result = await pipeline(text);
			return result[0] as SentimentResult;
		} catch (error) {
			const message = error instanceof Error ? error.message : "unknown";
			throw new Error(`Inference error: ${message}`);
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

	private handleDownloadProgress(data: any): void {
		if (data.status === "downloading" && data.progress !== undefined) {
			const progress = data.progress.toFixed(1);
			new Notice(`📥 Downloading: ${data.file} (${progress}%)`, 3000);
		}
	}
}
