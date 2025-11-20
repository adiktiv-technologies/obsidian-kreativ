import { Plugin, Notice, MarkdownView } from "obsidian";
import * as path from "path";
import { getVaultRoot } from "./utils/vault";
import { setupModuleResolution } from "./utils/module-resolver";
import { ModelManager } from "./models/model-manager";
import { SentimentPipeline } from "./models/sentiment-pipeline";
import { SentimentResultModal } from "./ui/sentiment-result-modal";
import { KreativSettings, DEFAULT_SETTINGS } from "./settings";
import { KreativSettingTab } from "./ui/settings-tab";

export default class Kreativ extends Plugin {
	settings!: KreativSettings;
	private modelManager!: ModelManager;
	private sentimentPipeline!: SentimentPipeline;

	async onload(): Promise<void> {
		console.log("✅ Loading Kreativ Plugin");

		// Load settings
		await this.loadSettings();

		// Add settings tab
		this.addSettingTab(new KreativSettingTab(this.app, this));

		this.modelManager = new ModelManager();
		this.sentimentPipeline = new SentimentPipeline(this.modelManager);

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
		console.log("📴 Unloading Kreativ Plugin");
		this.modelManager.unloadAllModels();
	}

	// ------------------------------------------------------------------------
	// Settings Methods
	// ------------------------------------------------------------------------

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	// ------------------------------------------------------------------------
	// Initialization Methods
	// ------------------------------------------------------------------------

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
		// Sentiment analysis command
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

		// Development: reload model command
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
		this.addRibbonIcon("brain-circuit", "Kreativ: Analyze Sentiment", () => {
			const view = this.app.workspace.getActiveViewOfType(MarkdownView);
			const editor = view?.editor;

			if (!editor) {
				new Notice("📝 Please open a note first");
				return;
			}

			const text = editor.getSelection() || editor.getValue();
			this.analyzeText(text);
		});
	}

	private startModelPreload(): void {
		const vaultRoot = getVaultRoot(this.app);
		const cacheDir = path.join(vaultRoot, this.settings.modelCachePath);

		this.sentimentPipeline.load(cacheDir).catch((error) => {
			console.error("❌ Model preload failed:", error);
			new Notice("⚠️ Kreativ: Model load failed. Check console.");
		});
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

			const vaultRoot = getVaultRoot(this.app);
			const cacheDir = path.join(vaultRoot, this.settings.modelCachePath);
			await this.sentimentPipeline.load(cacheDir);

			if (!this.sentimentPipeline.isReady()) return;
		}

		try {
			new Notice("🧠 Analyzing…", 2000);
			const result = await this.sentimentPipeline.analyze(text);

			if (!result) {
				new Notice("❌ Analysis failed", 3000);
				return;
			}

			const { label, score } = result;
			const confidence = (score * 100).toFixed(1);
			const emoji = label === "POSITIVE" ? "🙂" : "🙁";

			new Notice(`${emoji} ${label} (${confidence}%)`, 4000);

			// Show detailed modal based on settings
			if (this.settings.showDetailedResults && (text.length > 30 || score < this.settings.sentimentThreshold)) {
				new SentimentResultModal(this.app, { text, label, score }).open();
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : "unknown";
			console.error("💥 Inference failed", error);
			new Notice(`💥 Inference error: ${message}`, 5000);
		}
	}
}
