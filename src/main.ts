import { Plugin } from 'obsidian';
import { DEFAULT_SETTINGS, KreativPluginSettings } from "./settings";
import { KreativSettingTab } from "./ui/settings-tab";

export default class KreativPlugin extends Plugin {
	settings!: KreativPluginSettings;

	async onload() {
		await this.loadSettings();

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new KreativSettingTab(this.app, this));
	}

	onunload() {
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<KreativPluginSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
