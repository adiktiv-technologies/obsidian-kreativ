import { Plugin, Notice } from 'obsidian'
import { DEFAULT_SETTINGS, KreativSettings } from "./settings"
import { KreativSettingTab } from "./ui/settings-tab"

export default class Kreativ extends Plugin {
	settings!: KreativSettings

	async onload() {
		await this.loadSettings()

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new KreativSettingTab(this.app, this))

		if (this.settings.autoLoadModels) {
			new Notice("Kreativ: auto-loading models on startup...")
			// Add model loading logic here
		}
	}

	onunload() {
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<KreativSettings>)
	}

	async saveSettings() {
		await this.saveData(this.settings)
	}
}
