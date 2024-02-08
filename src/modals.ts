import { App, Modal, MarkdownView, TextAreaComponent, ButtonComponent, Notice } from "obsidian";

/**
 * A modal to generate completion using LLMs
 */
export class GenerateCompletionModal extends Modal {
	result: string;
	// onSubmit: (result: string) => void;

	private selectedText: string;
	private outputArea: TextAreaComponent;
	private generateButton: ButtonComponent;
	private integrateButton: ButtonComponent;

	constructor(app: App, onSubmit?: (result: string) => void) {
		super(app);
		// this.onSubmit = onSubmit;
		// this.selectedText = this.app.workspace.getActiveLeaf().view.editor.getSelection();

		this.titleEl.setText("Generate Completion");

		// Safely attempt to get the active MarkdownView and its selection
		const activeMarkdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (activeMarkdownView && activeMarkdownView.editor) {
			this.selectedText = activeMarkdownView.editor.getSelection();
		}
	}

	onOpen() {
		const { contentEl } = this;

		// Prompt Input
		new TextAreaComponent(contentEl)
			.setValue(this.selectedText)
			.setPlaceholder("Enter prompt here")
			.onChange((value: string) => {
				this.selectedText = value;
			})
			.inputEl.addClass("generate-completion-modal");

		// Generate Button
		this.generateButton = new ButtonComponent(contentEl).setButtonText("Generate").onClick(() => this.generateContent());
		this.generateButton.buttonEl.addClass("generate-button-modal");

		// Output Area (Initially hidden)
		this.outputArea = new TextAreaComponent(contentEl).setValue("").setPlaceholder("Generated content will appear here");
		this.outputArea.inputEl.addClass("generated-content-modal");

		// Integrate Button (Initially hidden)
		this.integrateButton = new ButtonComponent(contentEl).setButtonText("Integrate into note");
		// .onClick(() => this.integrateContent())
		// 	.hide();
		this.integrateButton.buttonEl.addClass("integrate-button-modal");
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}

	// Implement the logic to interact with LLMs here
	private async generateContent(): Promise<void> {
		this.generateButton.buttonEl.addClass("loading-spinner");
		setTimeout(() => {
			// this.outputArea.setValue("Generated content").show();
			// this.integrateButton.show();
			this.generateButton.buttonEl.removeClass("loading-spinner");
			new Notice("Generating content...");
		}, 3000); // Simulate a 3-second operation
	}

	// private integrateContent(): void {
	// 	this.app.workspace.getActiveLeaf()?.view.editor.replaceSelection(this.outputArea.getValue());
	// 	this.close();
	// }
}
