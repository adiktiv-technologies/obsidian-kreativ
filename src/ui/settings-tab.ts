import { App, PluginSettingTab, Setting } from "obsidian"
import Kreativ from "../main"

export class KreativSettingTab extends PluginSettingTab {
	plugin: Kreativ

	constructor(app: App, plugin: Kreativ) {
		super(app, plugin)
		this.plugin = plugin
	}

	display(): void {
		const { containerEl } = this
		containerEl.empty()
		containerEl.addClass("kreativ-settings")

		this.renderHeader()
		this.renderModelSettings()
	}

	private renderHeader(): void {
		const { containerEl } = this

		new Setting(containerEl)
			.setName("Kreativ")
			.setHeading()

		new Setting(containerEl)
			.setDesc("Configure local AI features for your vault.")
			.setClass("setting-item-description")
	}

	private renderModelSettings(): void {
		const { containerEl, plugin } = this
		new Setting(containerEl)
			.setName("Model caching")
			.setHeading()

		new Setting(containerEl)
			.setName("Auto-load models on startup")
			.setDesc("Automatically preload ML models when Obsidian starts. Disable to reduce startup time.")
			.addToggle((toggle) =>
				toggle
					.setValue(plugin.settings.autoLoadModels)
					.onChange(async (value) => {
						plugin.settings.autoLoadModels = value
						await plugin.saveSettings()
					})
			)
	}
}
