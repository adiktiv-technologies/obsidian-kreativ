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
			// T5-small only supports translation to/from English reliably
			// For non-English pairs, use two-step translation via English
			let finalResult: string;

			if (sourceLanguage !== "English" && targetLanguage !== "English") {
				// Step 1: Source language to English
				const toEnglishPrefix = `translate ${sourceLanguage} to English: `;
				const englishResult = await pipeline(toEnglishPrefix + text, {
					max_length: 1024,
				});

				if (!Array.isArray(englishResult) || englishResult.length === 0) {
					return null;
				}

				const englishText = englishResult[0].translation_text;

				// Step 2: English to target language
				const fromEnglishPrefix = `translate English to ${targetLanguage}: `;
				const finalResultArray = await pipeline(fromEnglishPrefix + englishText, {
					max_length: 1024,
				});

				if (!Array.isArray(finalResultArray) || finalResultArray.length === 0) {
					return null;
				}

				finalResult = finalResultArray[0].translation_text;
			} else {
				// Direct translation (one language is English)
				const taskPrefix = `translate ${sourceLanguage} to ${targetLanguage}: `;
				const result = await pipeline(taskPrefix + text, {
					max_length: 1024,
				});

				if (!Array.isArray(result) || result.length === 0) {
					return null;
				}

				finalResult = result[0].translation_text;
			}

			return finalResult || null;

		} catch (error) {
			console.error("Translation error:", error);
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
