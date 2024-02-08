import { Notice, Menu, Plugin, setIcon } from "obsidian";
import SettingTab, { DEFAULT_SETTINGS } from "settings";
import { GenerateCompletionModal } from "modals";

export default class MyPlugin extends Plugin {
	settings: Settings;

	private createStatusBarItem() {
		const item = this.addStatusBarItem();
		setIcon(item, "brain-circuit");
		item.onClickEvent(() => {
			const { defaultEngine, engines } = this.settings;
			const defaultModel = engines[defaultEngine].defaultModel;
			const modelSize = engines[defaultEngine].models[defaultModel].size;
			const modelSizeGB = (modelSize / 1024 / 1024 / 1024).toFixed(2);
			const engineInfo = `Current Engine: ${defaultEngine}\nModel Name: ${defaultModel}\nModel Size: ${modelSizeGB} GB`;
			new Notice(engineInfo);
		})
	}

	private displayRibbonIconMenu(event: MouseEvent) {
		const menu = new Menu();

		menu.addItem((item) =>
			item
				.setTitle("Copy")
				.setIcon("documents")
				.onClick(() => {
					new Notice("Copied");
				})
		);

		menu.addItem((item) =>
			item
				.setTitle("Paste")
				.setIcon("paste")
				.onClick(() => {
					new Notice("Pasted");
				})
		);

		menu.showAtMouseEvent(event);
	}

	async onload() {
		await this.loadSettings();

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SettingTab(this.app, this));

		// This adds a status bar item to the bottom of the app.
		this.createStatusBarItem();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon("brain-circuit", "Kreativ", (event: MouseEvent) => {
			// Called when the user clicks the icon.
			// if left button mouse click
			if (event.button === 0) {
				new GenerateCompletionModal(this.app).open();
			} else {
				// if right button mouse click
				this.displayRibbonIconMenu(event);
			}
		});
		ribbonIconEl.addClass("ribbon-class");

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: "open-generate-completion-modal",
			name: "Open Generate Completion",
			callback: () => {
				new GenerateCompletionModal(this.app).open();
			}
		});
	}

	async onunload() {
		console.log("unloading kreativ plugin");
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
