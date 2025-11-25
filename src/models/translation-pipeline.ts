import { Notice } from "obsidian";
import { ModelManager } from "./model-manager";

export interface TranslationResult {
	translation_text: string;
}

export class TranslationPipeline {
	private static readonly MODEL_KEY = "translation:Xenova/t5-small";
	private static readonly MODEL_ID = "Xenova/t5-small";
	private static readonly TASK = "translation";

	private modelManager: ModelManager;
	private cacheDir = "";

	constructor(modelManager: ModelManager) {
		this.modelManager = modelManager;
	}

	async load(cacheDir: string): Promise<void> {
		this.cacheDir = cacheDir;

		await this.modelManager.loadModel(
			{
				task: TranslationPipeline.TASK,
				modelId: TranslationPipeline.MODEL_ID
			},
			{
				progressCallback: this.handleDownloadProgress.bind(this),
			}
		);
	}

	async translate(
		text: string,
		sourceLanguage: string,
		targetLanguage: string
	): Promise<string | null> {
		const pipeline = this.modelManager.getModel(TranslationPipeline.MODEL_KEY);
		if (!pipeline) return null;

		try {
			const taskPrefix = `translate ${sourceLanguage} to ${targetLanguage}: `;

			pipeline.task = `translation_${sourceLanguage}_to_${targetLanguage}`;

			const result = await pipeline(taskPrefix + text, {
				max_length: 1024,
				callback_function: function (beams) {
					const decodedText = pipeline.tokenizer.decode(beams[0].output_token_ids, {
						skip_special_tokens: true,
					})
					console.log("Intermediate translation output:", decodedText);
				}
			});

			if (Array.isArray(result) && result.length > 0) {
				return result[0].translation_text || null;
			}

			return null;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "unknown";
			throw new Error(`Translation error: ${errorMessage}`);
		}
	}

	isReady(): boolean {
		return this.modelManager.hasModel(TranslationPipeline.MODEL_KEY);
	}

	isLoadingModel(): boolean {
		return this.modelManager.isModelLoading(TranslationPipeline.MODEL_KEY);
	}

	unload(): void {
		this.modelManager.unloadModel(TranslationPipeline.MODEL_KEY);
	}

	private handleDownloadProgress(data: { status?: string; progress?: number; file?: string }): void {
		if (data.status === "downloading" && data.progress !== undefined) {
			const progress = data.progress.toFixed(1);
			new Notice(`📥 Downloading translation model: ${data.file} (${progress}%)`, 3000);
		}
	}
}
