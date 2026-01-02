import { App, PluginSettingTab } from "obsidian";
import Kreativ from "../main";

export class KreativSettingTab extends PluginSettingTab {
	plugin: Kreativ;

	constructor(app: App, plugin: Kreativ) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();
	}
}
