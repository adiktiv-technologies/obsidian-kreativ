import { App, Modal } from "obsidian";

export interface TranslationData {
	originalText: string;
	translatedText: string;
	sourceLanguage: string;
	targetLanguage: string;
}

export class TranslationResultModal extends Modal {
	data: TranslationData;

	constructor(app: App, data: TranslationData) {
		super(app);
		this.data = data;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("kreativ-translation-modal");

		this.renderHeader();
		this.renderLanguageInfo();
		this.renderOriginalText();
		contentEl.createEl("hr");
		this.renderTranslatedText();
		this.renderButtons();
	}

	onClose(): void {
		this.contentEl.empty();
	}

	private renderHeader(): void {
		const title = this.contentEl.createEl("h2", { text: "🌐 Translation Result" });
		title.addClass("kreativ-modal-title");
	}

	private renderLanguageInfo(): void {
		const languageInfo = this.contentEl.createDiv({ cls: "kreativ-language-info" });
		languageInfo.createEl("span", {
			text: `${this.data.sourceLanguage} → ${this.data.targetLanguage}`,
			cls: "kreativ-language-badge",
		});
	}

	private renderOriginalText(): void {
		const originalSection = this.contentEl.createDiv({ cls: "kreativ-text-section" });
		originalSection.createEl("h3", { text: "Original" });
		const originalBox = originalSection.createDiv({ cls: "kreativ-text-box" });
		originalBox.createEl("p", { text: this.data.originalText });
	}

	private renderTranslatedText(): void {
		const translatedSection = this.contentEl.createDiv({ cls: "kreativ-text-section" });
		translatedSection.createEl("h3", { text: "Translation" });
		const translatedBox = translatedSection.createDiv({
			cls: "kreativ-text-box kreativ-translation-result",
		});
		translatedBox.createEl("p", { text: this.data.translatedText });
	}

	private renderButtons(): void {
		const buttonContainer = this.contentEl.createDiv({ cls: "kreativ-button-container" });
		this.createCopyButton(buttonContainer);
		this.createCloseButton(buttonContainer);
	}

	private createCopyButton(container: HTMLElement): void {
		const copyButton = container.createEl("button", {
			text: "📋 Copy Translation",
			cls: "mod-cta",
		});
		copyButton.addEventListener("click", () => {
			navigator.clipboard.writeText(this.data.translatedText);
			copyButton.textContent = "✅ Copied!";
			setTimeout(() => {
				copyButton.textContent = "📋 Copy Translation";
			}, 2000);
		});
	}

	private createCloseButton(container: HTMLElement): void {
		const closeButton = container.createEl("button", { text: "Close" });
		closeButton.addEventListener("click", () => this.close());
	}
}
