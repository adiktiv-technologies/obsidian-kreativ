import { App, PluginSettingTab } from "obsidian";
import KreativPlugin from "../main";

export class KreativSettingTab extends PluginSettingTab {
	plugin: KreativPlugin;

	constructor(app: App, plugin: KreativPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();
	}
}
