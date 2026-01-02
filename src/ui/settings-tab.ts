import { App, PluginSettingTab, Setting } from "obsidian"
import Kreativ from "../main"
import { SETTINGS_STRINGS } from "../constants"

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
		this.renderFooter()
	}

	private renderHeader(): void {
		const { containerEl } = this
		const { heading, description } = SETTINGS_STRINGS

		new Setting(containerEl)
			.setName(heading)
			.setHeading()

		new Setting(containerEl)
			.setDesc(description)
			.setClass("setting-item-description")
	}

	private renderModelSettings(): void {
		const { containerEl, plugin } = this
		const { modelCaching } = SETTINGS_STRINGS

		new Setting(containerEl)
			.setName(modelCaching.heading)
			.setHeading()

		new Setting(containerEl)
			.setName(modelCaching.autoLoad.name)
			.setDesc(modelCaching.autoLoad.desc)
			.addToggle((toggle) =>
				toggle
					.setValue(plugin.settings.autoLoadModels)
					.onChange(async (value) => {
						plugin.settings.autoLoadModels = value
						await plugin.saveSettings()
					})
			)
	}

	private renderFooter(): void {
		const { containerEl } = this
		const { footer } = SETTINGS_STRINGS

		containerEl.createEl("hr")
		const footerEl = containerEl.createDiv({ cls: "kreativ-settings-footer" })
		footerEl.createEl("p", { text: footer.privacy })
		footerEl.createEl("p", { text: footer.models })
		footerEl.createEl("p", { text: footer.translate })
		footerEl.createEl("p", { text: footer.tip })
	}
}
