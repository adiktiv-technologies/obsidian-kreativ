import { App, PluginSettingTab, Setting } from "obsidian";
import type Kreativ from "../main";

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
			text: "💡 Tip: Restart Obsidian or reload the plugin after changing model settings.",
		});
	}
}
