import { Plugin, Notice, MarkdownView, Menu } from "obsidian";
import * as path from "path";
import { getVaultRoot } from "./utils/vault";
import { setupModuleResolution } from "./utils/module-resolver";
import { ModelManager } from "./models/model-manager";
import { SentimentPipeline } from "./models/sentiment-pipeline";
import { TranslationPipeline } from "./models/translation-pipeline";
import { SentimentResultModal } from "./ui/sentiment-result-modal";
import { TranslationResultModal } from "./ui/translation-result-modal";
import { KreativSettings, DEFAULT_SETTINGS } from "./settings";
import { KreativSettingTab } from "./ui/settings-tab";

export default class Kreativ extends Plugin {
	settings!: KreativSettings;
	private modelManager!: ModelManager;
	private sentimentPipeline!: SentimentPipeline;
	private translationPipeline!: TranslationPipeline;

	async onload(): Promise<void> {
		// Re-initialize with correct vault path (the early init used a fallback)
		this.initializeModuleResolution();

		await this.loadSettings();

		this.addSettingTab(new KreativSettingTab(this.app, this));
		this.modelManager = new ModelManager(this.getCacheDirectory());
		this.sentimentPipeline = new SentimentPipeline(this.modelManager);
		this.translationPipeline = new TranslationPipeline(this.modelManager);

		this.registerCommands();

		if (this.settings.showRibbonIcon) {
			this.registerRibbonIcon();
		}

		if (this.settings.autoLoadModels) {
			this.preloadModels();
		}
	}

	onunload(): void {
		if (this.modelManager) {
			this.modelManager.unloadAllModels();
		}
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	private getCacheDirectory(): string {
		return path.join(getVaultRoot(this.app), this.settings.modelCachePath);
	}

	private initializeModuleResolution(): void {
		setupModuleResolution(
			path.join(
				getVaultRoot(this.app),
				".obsidian",
				"plugins",
				"kreativ",
				"node_modules"
			)
		)
	}

	private registerCommands(): void {
		this.addCommand({
			id: "analyze-sentiment",
			name: "Analyze sentiment of selected text",
			editorCheckCallback: (checking, editor) => {
				const text = editor.getSelection();
				if (checking) return text.trim().length > 0;
				console.log(`X -->`, text);
				this.analyzeSentiment(text);
				return true;
			},
		});

		this.addCommand({
			id: "translate-text",
			name: "Translate selected text",
			editorCheckCallback: (checking, editor) => {
				const text = editor.getSelection();
				if (checking) return text.trim().length > 0 && this.settings.translationEnabled;
				this.translateText(text || editor.getValue());
				return true;
			},
		});

		if (process.env.NODE_ENV === "development") {
			this.addCommand({
				id: "reload-model",
				name: "🔄 Reload ML Model (Dev)",
				callback: () => {
					this.sentimentPipeline.load(this.getCacheDirectory());
				},
			});
		}
	}

	private registerRibbonIcon(): void {
		this.addRibbonIcon("brain-circuit", "Kreativ AI Tools", (evt: MouseEvent) => {
			const view = this.app.workspace.getActiveViewOfType(MarkdownView);
			const editor = view?.editor;

			if (!editor) {
				new Notice("📝 Please open a note first");
				return;
			}

			const menu = new Menu();

			menu.addItem((item) => {
				item
					.setTitle("🧠 Analyze Sentiment")
					.setIcon("smile")
					.onClick(() => {
						const text = editor.getSelection() || editor.getValue();
						this.analyzeSentiment(text)
					});
			});

			menu.addItem((item) => {
				item
					.setTitle("🌐 Translate Text")
					.setIcon("languages")
					.onClick(() => {
						if (!this.settings.translationEnabled) {
							new Notice("⚠️ Translation is disabled. Enable it in settings.", 4000);
							return;
						}
						const text = editor.getSelection() || editor.getValue();
						this.translateText(text);
					});
			});

			menu.showAtMouseEvent(evt);
		});
	}

	private preloadModels(): void {
		const cacheDirectory = this.getCacheDirectory();

		this.sentimentPipeline.load(cacheDirectory).catch((error) => {
			console.error("Sentiment model preload failed:", error);
			new Notice("⚠️ Kreativ: Model load failed. See console for details.");
		});

		if (this.settings.translationEnabled) {
			this.translationPipeline.load(cacheDirectory).catch((error) => {
				console.error("Translation model preload failed:", error);
				new Notice("⚠️ Kreativ: Translation model load failed. See console for details.");
			});
		}
	}

	private async ensurePipelineReady(
		pipeline: SentimentPipeline | TranslationPipeline,
		loadingMessage: string
	): Promise<boolean> {
		if (pipeline.isReady()) return true;

		if (pipeline.isLoadingModel()) {
			new Notice(loadingMessage, 3000);
			return false;
		}

		await pipeline.load(this.getCacheDirectory());
		return pipeline.isReady();
	}

	private async analyzeSentiment(text: string): Promise<void> {

		if (!text.trim()) {
			new Notice("🔤 Please select or enter text to analyze");
			return;
		}

		const isReady = await this.ensurePipelineReady(
			this.sentimentPipeline,
			"⏳ Model still loading… please wait"
		);
		if (!isReady) return;

		try {
			new Notice("🧠 Analyzing…", 2000);
			const result = await this.sentimentPipeline.analyze(text);
			if (!result) {
				new Notice("❌ Analysis failed", 3000);
				return;
			}
			this.displaySentimentResult(text, result);
		} catch (error) {
			this.handleError(error, "Inference");
		}
	}

	private displaySentimentResult(text: string, result: { label: string; score: number }): void {
		const { label, score } = result;
		const confidencePercentage = (score * 100).toFixed(1);
		const emoji = label === "POSITIVE" ? "🙂" : "🙁";

		new Notice(`${emoji} ${label} (${confidencePercentage}%)`, 4000);

		const shouldShowModal = this.settings.showDetailedResults &&
			(text.trim().length > 30 || score < this.settings.sentimentThreshold);

		if (shouldShowModal) {
			new SentimentResultModal(this.app, { label, score }).open();
		}
	}

	private async translateText(text: string): Promise<void> {
		if (!text.trim()) {
			new Notice("🔤 Please select or enter text to translate");
			return;
		}

		if (!this.settings.translationEnabled) {
			new Notice("⚠️ Translation is disabled. Enable it in settings.", 4000);
			return;
		}

		const isReady = await this.ensurePipelineReady(
			this.translationPipeline,
			"⏳ Translation model still loading… please wait"
		);
		if (!isReady) return;

		try {
			new Notice("🌐 Translating…", 2000);
			const translatedText = await this.translationPipeline.translate(
				text,
				this.settings.translationSourceLanguage,
				this.settings.translationTargetLanguage
			);

			if (!translatedText) {
				new Notice("❌ Translation failed", 3000);
				return;
			}

			new TranslationResultModal(this.app, {
				originalText: text,
				translatedText,
				sourceLanguage: this.settings.translationSourceLanguage,
				targetLanguage: this.settings.translationTargetLanguage,
			}).open();
		} catch (error) {
			this.handleError(error, "Translation");
		}
	}

	private handleError(error: unknown, context: string): void {
		const errorMessage = error instanceof Error ? error.message : "unknown";
		console.error(`${context} error:`, error);
		new Notice(`💥 ${context} error: ${errorMessage}`, 5000);
	}
}
