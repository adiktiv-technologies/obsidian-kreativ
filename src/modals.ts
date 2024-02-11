import { App, Modal, MarkdownView, TextAreaComponent, ButtonComponent, Notice } from "obsidian";
import { OllamaAPI } from "api/ollama";
import Plugin from "main";

/**
 * A modal to generate completion using LLMs
 */
export class GenerateCompletionModal extends Modal {
	plugin: Plugin;
	result: string;

	private selectedText: string;
	private inputArea: TextAreaComponent;
	private outputArea: TextAreaComponent;
	private generateButton: ButtonComponent;
	private integrateButton: ButtonComponent;

	constructor(app: App, plugin: Plugin) {
		super(app);
		this.plugin = plugin;
		this.titleEl.setText("Generate Completion");

		// Safely attempt to get the active MarkdownView and its selection
		const activeMarkdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (activeMarkdownView && activeMarkdownView.editor) {
			this.selectedText = activeMarkdownView.editor.getSelection();

			if (this.selectedText === "") {
				new Notice("Select some text to generate completion from.");
				setTimeout(() => this.close(), 0)
			}
		}
	}

	onOpen() {
		const { contentEl } = this;

		// Prompt Input
		this.inputArea = new TextAreaComponent(contentEl)
			.setValue(this.selectedText)
			.setPlaceholder("Enter prompt here")
			.onChange((value: string) => {
				this.selectedText = value;
			});
		this.inputArea.inputEl.addClass("generate-completion-modal");

		// Create a flex container
		const flexContainer = contentEl.createDiv();
		flexContainer.style.display = "flex";
		flexContainer.style.gap = "10px";
		flexContainer.style.justifyContent = "space-between";
		flexContainer.style.height = "5em";

		// Generate Button 
		this.generateButton = new ButtonComponent(flexContainer)
			.setButtonText("Generate")
			.onClick(() => this.generateContent());
		this.generateButton.buttonEl.addClass("generate-button-modal");

		// Output Area
		this.outputArea = new TextAreaComponent(contentEl)
			.setValue("")
			.setPlaceholder("Generated content will appear here");
		this.outputArea.inputEl.addClass("generated-content-modal");

		// Integrate Button
		this.integrateButton = new ButtonComponent(contentEl)
			.setButtonText("Add to note")
			.onClick(() => this.integrateContent())

		this.integrateButton.buttonEl.addClass("integrate-button-modal");
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}

	// Implement the logic to interact with LLMs here
	private async generateContent(): Promise<void> {
		const { plugin } = this;

		this.generateButton.disabled = true;
		this.generateButton.buttonEl.addClass("spinner");

		const ollamaAPI = new OllamaAPI(plugin.settings.engines[plugin.settings.defaultEngine].url);

		new Notice("Generating content...");

		this.result = await ollamaAPI.generateCompletion(
			plugin.settings.engines[plugin.settings.defaultEngine].defaultModel,
			plugin.settings.prePrompt
			+ JSON.stringify({
				...plugin.settings.commands[2],
				input: this.selectedText
			}),
			{
				stream: false
			});
		this.outputArea.setValue(this.result);

		this.generateButton.buttonEl.removeClass("spinner")
		this.generateButton.disabled = false;

	}

	private integrateContent(): void {
		// this.app.workspace.getActiveLeaf()?.view.editor.replaceSelection(this.outputArea.getValue());
		this.close();
	}
}
