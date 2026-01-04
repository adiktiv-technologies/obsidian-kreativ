import { App, PluginSettingTab, Setting } from "obsidian"
import Kreativ from "../main"
import { SETTINGS_STRINGS, UI_STRINGS } from "../constants"
import { ModelLoadProgress } from "../../global"

export class KreativSettingTab extends PluginSettingTab {
	plugin: Kreativ
	private modelButtonEl: HTMLButtonElement | null = null
	private isDownloading: boolean = false
	private isModelReady: boolean = false

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
		this.renderSentimentSettings()
		this.renderFooter()

		// Register progress callback when settings tab is open
		this.plugin.onModelProgress((progress: ModelLoadProgress) => {
			this.handleModelProgress(progress)
		})
	}

	hide(): void {
		// Unregister callback when settings tab is closed
		this.plugin.onModelProgress(null)
	}

	private handleModelProgress(progress: ModelLoadProgress): void {
		if (!this.modelButtonEl) return

		if (progress.status === "loading") {
			this.isDownloading = true
			this.modelButtonEl.setText(`${UI_STRINGS.modelManagement.downloading} ${progress.overallProgress}%`)
			this.modelButtonEl.addClass("kreativ-downloading")
			this.modelButtonEl.disabled = true
		} else if (progress.status === "ready") {
			this.isDownloading = false
			this.isModelReady = true
			this.updateModelButton()
		}
	}

	private updateModelButton(): void {
		if (!this.modelButtonEl) return

		this.modelButtonEl.removeClass("kreativ-downloading")
		this.modelButtonEl.disabled = false

		if (this.isModelReady) {
			this.modelButtonEl.setText(UI_STRINGS.modelManagement.deleteModel)
			this.modelButtonEl.addClass("mod-warning")
		} else {
			this.modelButtonEl.setText(UI_STRINGS.modelManagement.downloadModel)
			this.modelButtonEl.removeClass("mod-warning")
		}
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

	private renderSentimentSettings(): void {
		const { containerEl, plugin } = this
		const { sentimentAnalysis } = SETTINGS_STRINGS

		new Setting(containerEl)
			.setName(sentimentAnalysis.heading)
			.setHeading()

		// Model download/delete button
		new Setting(containerEl)
			.setName(sentimentAnalysis.model.name)
			.setDesc(sentimentAnalysis.model.desc)
			.addButton((button) => {
				this.modelButtonEl = button.buttonEl
				// Check initial state from settings (synchronous)
				this.isModelReady = plugin.isSentimentModelDownloaded()
				this.updateModelButton()

				button.onClick(async () => {
					if (this.isDownloading) return

					if (this.isModelReady) {
						// Delete model
						this.modelButtonEl?.setText(UI_STRINGS.modelManagement.deleting)
						this.modelButtonEl?.addClass("kreativ-downloading")
						const deleted = await plugin.deleteSentimentModel()
						if (deleted) {
							this.isModelReady = false
						}
						this.updateModelButton()
					} else {
						// Download model
						await plugin.downloadSentimentModel()
					}
				})
			})

		new Setting(containerEl)
			.setName(sentimentAnalysis.threshold.name)
			.setDesc(sentimentAnalysis.threshold.desc)
			.addSlider((slider) =>
				slider
					.setLimits(0, 1, 0.05)
					.setValue(this.plugin.settings.sentimentThreshold)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.sentimentThreshold = value
						await this.plugin.saveSettings()
					})
			)

		new Setting(containerEl)
			.setName(sentimentAnalysis.enable.name)
			.setDesc(sentimentAnalysis.enable.desc)
			.addToggle((toggle) =>
				toggle
					.setValue(plugin.settings.enableSentiment)
					.onChange(async (value) => {
						plugin.settings.enableSentiment = value
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
