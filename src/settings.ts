import {App, PluginSettingTab, Setting} from "obsidian";
import KreativPlugin from "./main";

export interface KreativPluginSettings {
	mySetting: string;
}

export const DEFAULT_SETTINGS: KreativPluginSettings = {
	mySetting: 'default'
}

export class KreativSettingTab extends PluginSettingTab {
	plugin: KreativPlugin;

	constructor(app: App, plugin: KreativPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Settings #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
