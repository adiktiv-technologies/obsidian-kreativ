import { Plugin, Notice } from 'obsidian'
import { DEFAULT_SETTINGS, KreativSettings } from "./settings"
import { KreativSettingTab } from "./ui/settings-tab"

import { WorkerPool } from "./worker/pool"

export default class Kreativ extends Plugin {
	settings!: KreativSettings
	workerPool!: WorkerPool

	async onload() {
		await this.loadSettings()

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new KreativSettingTab(this.app, this))

		if (this.settings.autoLoadModels) {
			new Notice("Kreativ: auto-loading models on startup...")
			// Add model loading logic here
		}

		this.workerPool = new WorkerPool()

		this.workerPool.spawn("default").then(() => {
			new Notice("Kreativ: worker initialized.")
		}).catch((err) => {
			new Notice("Kreativ: failed to initialize worker. See console for details.")
			console.error("Kreativ: worker initialization error:", err)
		})

		this.workerPool.spawn("translator").then(() => {
			new Notice("Kreativ: worker initialized.")
		}).catch((err) => {
			new Notice("Kreativ: failed to initialize worker. See console for details.")
			console.error("Kreativ: worker initialization error:", err)
		})
	}

	onunload() {
		this.workerPool.terminateAll().catch((err) => {
			console.error("Error terminating worker pool on unload:", err)
		})
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<KreativSettings>)
	}

	async saveSettings() {
		await this.saveData(this.settings)
	}
}
