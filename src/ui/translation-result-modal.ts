import { App, Modal, Notice, Setting } from "obsidian";
import type { TranslationPipeline } from "../models/translation-pipeline";
import { SUPPORTED_LANGUAGES, getLanguageByCode, getLanguageByName } from "../utils/language-mapping";

export class TranslationResultModal extends Modal {
	private originalText: string;
	private defaultTargetLanguage: string;
	private translationPipeline: TranslationPipeline;

	private selectedSourceLanguage = "";
	private selectedTargetLanguage = "";

	constructor(
		app: App,
		originalText: string,
		defaultTargetLanguage: string,
		translationPipeline: TranslationPipeline
	) {
		super(app);
		this.originalText = originalText;
		this.defaultTargetLanguage = defaultTargetLanguage;
		this.translationPipeline = translationPipeline;

		// Set default source to English
		this.selectedSourceLanguage = "English";

		// Set target language from settings or default to German
		const defaultLang = this.findLanguage(this.defaultTargetLanguage);
		this.selectedTargetLanguage = defaultLang?.t5Name ?? "German";
	}

	/**
	 * Find language by code, t5Name, or display name
	 */
	private findLanguage(identifier: string) {
		return getLanguageByCode(identifier) ?? getLanguageByName(identifier);
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("kreativ-translation-modal");

		// Validate language support
		if (SUPPORTED_LANGUAGES.length === 0) {
			contentEl.createEl("p", {
				text: "⚠️ No supported languages configured.",
				cls: "kreativ-error-message"
			});
			return;
		}

		this.renderHeader();
		this.renderOriginalText();
		this.renderLanguageSelection();
		this.renderTranslateButton();
		this.renderTranslationResult();
	}

	onClose(): void {
		this.contentEl.empty();
	}

	private renderHeader(): void {
		const title = this.contentEl.createEl("h2", { text: "🌐 Translate Text" });
		title.addClass("kreativ-modal-title");
	}

	private renderOriginalText(): void {
		const originalSection = this.contentEl.createDiv({ cls: "kreativ-text-section" });
		originalSection.createEl("h3", { text: "Original Text" });
		const originalBox = originalSection.createDiv({ cls: "kreativ-text-box" });
		originalBox.createEl("p", { text: this.originalText });
	}

	private renderLanguageSelection(): void {
		const selectionSection = this.contentEl.createDiv({ cls: "kreativ-language-selection" });

		// Source language dropdown
		new Setting(selectionSection)
			.setName("Source language")
			.setDesc("Select the language of your text")
			.addDropdown((dropdown) => {
				SUPPORTED_LANGUAGES.forEach(lang => {
					dropdown.addOption(lang.t5Name, lang.name);
				});

				dropdown.setValue(this.selectedSourceLanguage);
				dropdown.onChange((value) => {
					this.selectedSourceLanguage = value;
				});
			});

		// Target language dropdown
		new Setting(selectionSection)
			.setName("Target language")
			.setDesc("Select translation target language")
			.addDropdown((dropdown) => {
				SUPPORTED_LANGUAGES.forEach(lang => {
					dropdown.addOption(lang.t5Name, lang.name);
				});

				dropdown.setValue(this.selectedTargetLanguage);
				dropdown.onChange((value) => {
					this.selectedTargetLanguage = value;
				});
			});
	}

	private renderTranslateButton(): void {
		const buttonSection = this.contentEl.createDiv({ cls: "kreativ-translate-button-section" });

		const translateButton = buttonSection.createEl("button", {
			text: "🌐 Translate",
			cls: "mod-cta"
		});

		// Check if pipeline is ready
		if (!this.translationPipeline.isReady()) {
			translateButton.disabled = true;
			translateButton.textContent = "⏳ Loading model...";

			if (this.translationPipeline.isLoadingModel()) {
				// Model is loading, will be ready soon
				const checkReady = setInterval(() => {
					if (this.translationPipeline.isReady()) {
						translateButton.disabled = false;
						translateButton.textContent = "🌐 Translate";
						clearInterval(checkReady);
					}
				}, 500);

				// Cleanup interval when modal closes
				this.onClose = () => {
					clearInterval(checkReady);
					this.contentEl.empty();
				};
			} else {
				translateButton.textContent = "❌ Model not loaded";
			}
		}

		translateButton.addEventListener("click", async () => {
			await this.performTranslation();
		});
	}

	private renderTranslationResult(): void {
		const translationResultSection = this.contentEl.createDiv({
			cls: "kreativ-translation-result-section"
		});
		translationResultSection.style.display = "none";
	}

	private async performTranslation(): Promise<void> {
		if (!this.selectedSourceLanguage || !this.selectedTargetLanguage) {
			new Notice("❌ Please select both source and target languages");
			return;
		}

		if (this.selectedSourceLanguage === this.selectedTargetLanguage) {
			new Notice("⚠️ Source and target languages must be different");
			return;
		}

		if (!this.translationPipeline.isReady()) {
			new Notice("❌ Translation model not ready");
			return;
		}

		const translateButton = this.contentEl.querySelector(".kreativ-translate-button-section button") as HTMLButtonElement;
		if (!translateButton) return;

		translateButton.disabled = true;
		translateButton.textContent = "⏳ Translating...";

		try {
			const result = await this.translationPipeline.translate(
				this.originalText,
				this.selectedSourceLanguage,
				this.selectedTargetLanguage
			);

			if (result) {
				this.displayTranslationResult(result);
			} else {
				new Notice("❌ Translation failed");
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "unknown";
			new Notice(`❌ Translation error: ${errorMessage}`);
			console.error("Translation error:", error);
		} finally {
			translateButton.disabled = false;
			translateButton.textContent = "🌐 Translate";
		}
	}

	private displayTranslationResult(translatedText: string): void {
		const translationResultSection = this.contentEl.querySelector(".kreativ-translation-result-section") as HTMLElement;
		if (!translationResultSection) return;

		translationResultSection.empty();
		translationResultSection.style.display = "block";

		translationResultSection.createEl("hr");

		// Get display names for languages
		const sourceLang = getLanguageByCode(this.selectedSourceLanguage);
		const targetLang = getLanguageByCode(this.selectedTargetLanguage);
		const sourceDisplay = sourceLang?.name ?? this.selectedSourceLanguage;
		const targetDisplay = targetLang?.name ?? this.selectedTargetLanguage;

		const resultHeader = translationResultSection.createDiv({
			cls: "kreativ-language-info"
		});
		resultHeader.createEl("span", {
			text: `${sourceDisplay} → ${targetDisplay}`,
			cls: "kreativ-language-badge",
		});

		const translatedSection = translationResultSection.createDiv({
			cls: "kreativ-text-section"
		});
		translatedSection.createEl("h3", { text: "Translation" });

		const translatedBox = translatedSection.createDiv({
			cls: "kreativ-text-box kreativ-translation-result",
		});
		translatedBox.createEl("p", { text: translatedText });

		// Action buttons
		const buttonContainer = translationResultSection.createDiv({
			cls: "kreativ-button-container"
		});

		const copyButton = buttonContainer.createEl("button", {
			text: "📋 Copy Translation",
			cls: "mod-cta",
		});
		copyButton.addEventListener("click", () => {
			navigator.clipboard.writeText(translatedText);
			copyButton.textContent = "✅ Copied!";
			setTimeout(() => {
				copyButton.textContent = "📋 Copy Translation";
			}, 2000);
		});

		const closeButton = buttonContainer.createEl("button", { text: "Close" });
		closeButton.addEventListener("click", () => this.close());
	}
}
