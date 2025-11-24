import { App, PluginSettingTab, Setting } from "obsidian";
import * as path from "path";
import type Kreativ from "../main";
import { getVaultRoot, deleteModelCache } from "../utils/vault";

export class KreativSettingTab extends PluginSettingTab {
	plugin: Kreativ;

	constructor(app: App, plugin: Kreativ) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.addClass("kreativ-settings");

		this.renderHeader();
		this.renderModelSettings();
		this.renderAnalysisSettings();
		this.renderTranslationSettings();
		this.renderInterfaceSettings();
		this.renderFooter();
	}

	private renderHeader(): void {
		this.containerEl.createEl("h2", { text: "Kreativ Settings" });
		this.containerEl.createEl("p", {
			text: "Configure local AI features for your vault.",
			cls: "setting-item-description",
		});
	}

	private renderModelSettings(): void {
		const { containerEl } = this;
		containerEl.createEl("h3", { text: "Model Settings" });

		new Setting(containerEl)
			.setName("Model cache path")
			.setDesc(
				"Relative path from vault root where models are cached. Default: .obsidian/transformers-cache"
			)
			.addText((text) =>
				text
					.setPlaceholder(".obsidian/transformers-cache")
					.setValue(this.plugin.settings.modelCachePath)
					.onChange(async (value) => {
						this.plugin.settings.modelCachePath = value || ".obsidian/transformers-cache";
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Auto-load models on startup")
			.setDesc(
				"Automatically preload ML models when Obsidian starts. Disable to reduce startup time."
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.autoLoadModels)
					.onChange(async (value) => {
						this.plugin.settings.autoLoadModels = value;
						await this.plugin.saveSettings();
					})
			);
	}

	private renderAnalysisSettings(): void {
		const { containerEl } = this;
		containerEl.createEl("h3", { text: "Analysis Settings" });

		new Setting(containerEl)
			.setName("Sentiment confidence threshold")
			.setDesc(
				"Show detailed modal for results below this confidence level (0.0 - 1.0). Default: 0.8"
			)
			.addSlider((slider) =>
				slider
					.setLimits(0, 1, 0.05)
					.setValue(this.plugin.settings.sentimentThreshold)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.sentimentThreshold = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Show detailed results")
			.setDesc(
				"Display detailed analysis modal for low-confidence results or long text."
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.showDetailedResults)
					.onChange(async (value) => {
						this.plugin.settings.showDetailedResults = value;
						await this.plugin.saveSettings();
					})
			);
	}

	private renderTranslationSettings(): void {
		const { containerEl } = this;
		containerEl.createEl("h3", { text: "Translation Settings" });

		new Setting(containerEl)
			.setName("Translation model")
			.setDesc(
				"T5 Small (Xenova/t5-small) - 78 MB. Download to enable offline translation."
			)
			.addButton((button) => {
				const isModelLoaded = (this.plugin as any).translationPipeline?.isReady();

				button
					.setButtonText(isModelLoaded ? "🗑️ Delete Model" : "📥 Download Model")
					.setCta()
					.onClick(async () => {
						button.setDisabled(true);

						if (isModelLoaded) {
							await this.handleModelDeletion(button);
						} else {
							await this.handleModelDownload(button);
						}
					});
			});

		// Only show the toggle if the model is downloaded
		const isModelLoaded = (this.plugin as any).translationPipeline?.isReady();
		if (isModelLoaded) {
			new Setting(containerEl)
				.setName("Enable translation")
				.setDesc(
					"Enable or disable translation features."
				)
				.addToggle((toggle) =>
					toggle
						.setValue(this.plugin.settings.translationEnabled)
						.onChange(async (value) => {
							this.plugin.settings.translationEnabled = value;
							await this.plugin.saveSettings();
						})
				);
		}

		this.addLanguageSetting("Source language", "Default source language for translation.", "translationSourceLanguage");
		this.addLanguageSetting("Target language", "Default target language for translation.", "translationTargetLanguage");
	}

	private renderInterfaceSettings(): void {
		const { containerEl } = this;
		containerEl.createEl("h3", { text: "Interface Settings" });

		new Setting(containerEl)
			.setName("Show ribbon icon")
			.setDesc("Display the Kreativ icon in the left ribbon bar.")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.showRibbonIcon)
					.onChange(async (value) => {
						this.plugin.settings.showRibbonIcon = value;
						await this.plugin.saveSettings();
						containerEl.createEl("p", {
							text: "⚠️ Reload the plugin for this change to take effect.",
							cls: "mod-warning",
						});
					})
			);
	}

	private renderFooter(): void {
		const { containerEl } = this;
		containerEl.createEl("hr");
		const footer = containerEl.createDiv({ cls: "kreativ-settings-footer" });
		footer.createEl("p", {
			text: "🔒 Privacy First: All AI processing runs locally on your device. No data is sent to external servers.",
		});
		footer.createEl("p", {
			text: "📦 Models are downloaded from Hugging Face on first use and cached for offline operation.",
		});
		footer.createEl("p", {
			text: "🌐 To translate text: Select text in any note, then open Command Palette (Ctrl/Cmd+P) and search for 'Translate selected text'.",
		});
		footer.createEl("p", {
			text: "💡 Tip: You can assign a hotkey to the translate command in Obsidian's Hotkeys settings.",
		});
	}

	private addLanguageSetting(name: string, description: string, settingKey: "translationSourceLanguage" | "translationTargetLanguage"): void {
		const languages = ["English", "German", "French", "Spanish", "Italian", "Portuguese", "Romanian"];

		new Setting(this.containerEl)
			.setName(name)
			.setDesc(description)
			.addDropdown((dropdown) => {
				for (const lang of languages) {
					dropdown.addOption(lang, lang);
				}
				dropdown
					.setValue(this.plugin.settings[settingKey])
					.onChange(async (value) => {
						this.plugin.settings[settingKey] = value;
						await this.plugin.saveSettings();
					});
			});
	}

	private getCacheDirectory(): string {
		return path.join(getVaultRoot(this.app), this.plugin.settings.modelCachePath);
	}

	private async handleModelDeletion(button: any): Promise<void> {
		button.setButtonText("🗑️ Deleting...");
		try {
			(this.plugin as any).translationPipeline.unload();
			const deleted = deleteModelCache("Xenova/t5-small", this.getCacheDirectory());
			this.plugin.settings.translationEnabled = false;
			await this.plugin.saveSettings();
			button.setButtonText(deleted ? "✅ Deleted" : "✅ Unloaded");
			setTimeout(() => this.display(), 1000);
		} catch {
			button.setButtonText("❌ Failed");
			setTimeout(() => {
				button.setButtonText("🗑️ Delete Model");
				button.setDisabled(false);
			}, 2000);
		}
	}

	private async handleModelDownload(button: any): Promise<void> {
		button.setButtonText("⏳ Downloading...");
		try {
			await (this.plugin as any).translationPipeline.load(this.getCacheDirectory(), false);
			button.setButtonText("✅ Downloaded");
			setTimeout(() => this.display(), 1000);
		} catch {
			button.setButtonText("❌ Failed");
			setTimeout(() => {
				button.setButtonText("📥 Download Model");
				button.setDisabled(false);
			}, 2000);
		}
	}
}
