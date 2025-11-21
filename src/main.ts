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
		await this.loadSettings();
		this.addSettingTab(new KreativSettingTab(this.app, this));

		this.modelManager = new ModelManager();
		this.sentimentPipeline = new SentimentPipeline(this.modelManager);
		this.translationPipeline = new TranslationPipeline(this.modelManager);

		this.initializeModuleResolution();
		this.registerCommands();

		if (this.settings.showRibbonIcon) {
			this.registerRibbonIcon();
		}

		if (this.settings.autoLoadModels) {
			this.startModelPreload();
		}
	}

	onunload(): void {
		this.modelManager.unloadAllModels();
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	private initializeModuleResolution(): void {
		const vaultRoot = getVaultRoot(this.app);
		const pluginNodeModules = path.join(
			vaultRoot,
			".obsidian",
			"plugins",
			"kreativ",
			"node_modules"
		);
		setupModuleResolution(pluginNodeModules);
	}

	private registerCommands(): void {
		this.addCommand({
			id: "analyze-sentiment",
			name: "Analyze sentiment of selected text",
			editorCheckCallback: (checking, editor) => {
				const text = editor.getSelection();
				if (checking) return text.trim().length > 0;
				this.analyzeText(text || editor.getValue());
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
					const vaultRoot = getVaultRoot(this.app);
					const cacheDir = path.join(vaultRoot, this.settings.modelCachePath);
					this.sentimentPipeline.load(cacheDir, true);
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

			const text = editor.getSelection() || editor.getValue();
			const menu = new Menu();

			menu.addItem((item) => {
				item
					.setTitle("🧠 Analyze Sentiment")
					.setIcon("smile")
					.onClick(() => this.analyzeText(text));
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
						this.translateText(text);
					});
			});

			menu.showAtMouseEvent(evt);
		});
	}

	private startModelPreload(): void {
		const cacheDir = this.getCacheDirectory();

		this.sentimentPipeline.load(cacheDir).catch(() => {
			new Notice("⚠️ Kreativ: Model load failed. Check console.");
		});

		if (this.settings.translationEnabled) {
			this.translationPipeline.load(cacheDir).catch(() => {
				new Notice("⚠️ Kreativ: Translation model load failed. Check console.");
			});
		}
	}

	private getCacheDirectory(): string {
		const vaultRoot = getVaultRoot(this.app);
		return path.join(vaultRoot, this.settings.modelCachePath);
	}

	private async analyzeText(text: string): Promise<void> {
		if (!text.trim()) {
			new Notice("🔤 Please select or enter text to analyze");
			return;
		}

		if (!this.sentimentPipeline.isReady()) {
			if (this.sentimentPipeline.isLoadingModel()) {
				new Notice("⏳ Model still loading… please wait", 3000);
				return;
			}

			await this.sentimentPipeline.load(this.getCacheDirectory());

			if (!this.sentimentPipeline.isReady()) return;
		}

		try {
			new Notice("🧠 Analyzing…", 2000);
			const result = await this.sentimentPipeline.analyze(text);

			if (!result) {
				new Notice("❌ Analysis failed", 3000);
				return;
			}

			this.displaySentimentResult(text, result);
		} catch (error) {
			const message = error instanceof Error ? error.message : "unknown";
			new Notice(`💥 Inference error: ${message}`, 5000);
		}
	}

	private displaySentimentResult(text: string, result: { label: string; score: number }): void {
		const { label, score } = result;
		const confidence = (score * 100).toFixed(1);
		const emoji = label === "POSITIVE" ? "🙂" : "🙁";

		new Notice(`${emoji} ${label} (${confidence}%)`, 4000);

		if (this.shouldShowDetailedResults(text, score)) {
			new SentimentResultModal(this.app, { text, label, score }).open();
		}
	}

	private shouldShowDetailedResults(text: string, score: number): boolean {
		return this.settings.showDetailedResults && (text.length > 30 || score < this.settings.sentimentThreshold);
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

		if (!this.translationPipeline.isReady()) {
			if (this.translationPipeline.isLoadingModel()) {
				new Notice("⏳ Translation model still loading… please wait", 3000);
				return;
			}

			await this.translationPipeline.load(this.getCacheDirectory());

			if (!this.translationPipeline.isReady()) return;
		}

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
				translatedText: translatedText,
				sourceLanguage: this.settings.translationSourceLanguage,
				targetLanguage: this.settings.translationTargetLanguage,
			}).open();
		} catch (error) {
			const message = error instanceof Error ? error.message : "unknown";
			new Notice(`💥 Translation error: ${message}`, 5000);
		}
	}
}
