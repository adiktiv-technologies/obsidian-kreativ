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

		// Header
		containerEl.createEl("h2", { text: "Kreativ Settings" });
		containerEl.createEl("p", {
			text: "Configure local AI features for your vault.",
			cls: "setting-item-description",
		});

		// Model Settings Section
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

		// Analysis Settings Section
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

		// Translation Settings Section
		containerEl.createEl("h3", { text: "Translation Settings" });

		new Setting(containerEl)
			.setName("Enable translation")
			.setDesc(
				"Enable translation features. Download the T5 Small model (78 MB) to get started."
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.translationEnabled)
					.onChange(async (value) => {
						this.plugin.settings.translationEnabled = value;
						await this.plugin.saveSettings();
					})
			);

		// Download/Delete model button
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
							// Delete the model from memory and disk
							button.setButtonText("🗑️ Deleting...");
							try {
								// Unload from memory
								(this.plugin as any).translationPipeline.unload();

								// Delete from disk
								const vaultRoot = getVaultRoot(this.app);
								const cacheDir = path.join(
									vaultRoot,
									this.plugin.settings.modelCachePath
								);
								const deleted = deleteModelCache("Xenova/t5-small", cacheDir);

								// Disable translation when model is deleted
								this.plugin.settings.translationEnabled = false;
								await this.plugin.saveSettings();

								button.setButtonText(deleted ? "✅ Deleted" : "✅ Unloaded");
								setTimeout(() => {
									this.display(); // Refresh the settings display
								}, 1000);
							} catch (error) {
								button.setButtonText("❌ Failed");
								console.error("Delete failed:", error);
								setTimeout(() => {
									button.setButtonText("🗑️ Delete Model");
									button.setDisabled(false);
								}, 2000);
							}
						} else {
							// Download the model
							button.setButtonText("⏳ Downloading...");
							try {
								const vaultRoot = getVaultRoot(this.app);
								const cacheDir = path.join(
									vaultRoot,
									this.plugin.settings.modelCachePath
								);

								await (this.plugin as any).translationPipeline.load(
									cacheDir,
									false
								);

								button.setButtonText("✅ Downloaded");
								setTimeout(() => {
									this.display(); // Refresh the settings display
								}, 1000);
							} catch (error) {
								button.setButtonText("❌ Failed");
								console.error("Download failed:", error);
								setTimeout(() => {
									button.setButtonText("📥 Download Model");
									button.setDisabled(false);
								}, 2000);
							}
						}
					});
			});

		new Setting(containerEl)
			.setName("Source language")
			.setDesc("Default source language for translation.")
			.addDropdown((dropdown) =>
				dropdown
					.addOption("English", "English")
					.addOption("German", "German")
					.addOption("French", "French")
					.addOption("Spanish", "Spanish")
					.addOption("Italian", "Italian")
					.addOption("Portuguese", "Portuguese")
					.addOption("Romanian", "Romanian")
					.setValue(this.plugin.settings.translationSourceLanguage)
					.onChange(async (value) => {
						this.plugin.settings.translationSourceLanguage = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Target language")
			.setDesc("Default target language for translation.")
			.addDropdown((dropdown) =>
				dropdown
					.addOption("English", "English")
					.addOption("German", "German")
					.addOption("French", "French")
					.addOption("Spanish", "Spanish")
					.addOption("Italian", "Italian")
					.addOption("Portuguese", "Portuguese")
					.addOption("Romanian", "Romanian")
					.setValue(this.plugin.settings.translationTargetLanguage)
					.onChange(async (value) => {
						this.plugin.settings.translationTargetLanguage = value;
						await this.plugin.saveSettings();
					})
			);

		// UI Settings Section
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
						// Notify user to reload plugin for change to take effect
						containerEl.createEl("p", {
							text: "⚠️ Reload the plugin for this change to take effect.",
							cls: "mod-warning",
						});
					})
			);

		// Footer with additional info
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
}
