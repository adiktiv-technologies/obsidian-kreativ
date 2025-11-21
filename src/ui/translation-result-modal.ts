import { App, Modal } from "obsidian";

export interface TranslationData {
    originalText: string;
    translatedText: string;
    sourceLanguage: string;
    targetLanguage: string;
}

export class TranslationResultModal extends Modal {
    private readonly data: TranslationData;

    constructor(app: App, data: TranslationData) {
        super(app);
        this.data = data;
    }

    onOpen(): void {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass("kreativ-translation-modal");

        const title = contentEl.createEl("h2", { text: "🌐 Translation Result" });
        title.addClass("kreativ-modal-title");

        const languageInfo = contentEl.createDiv({ cls: "kreativ-language-info" });
        languageInfo.createEl("span", {
            text: `${this.data.sourceLanguage} → ${this.data.targetLanguage}`,
            cls: "kreativ-language-badge",
        });

        const originalSection = contentEl.createDiv({ cls: "kreativ-text-section" });
        originalSection.createEl("h3", { text: "Original" });
        const originalBox = originalSection.createDiv({ cls: "kreativ-text-box" });
        originalBox.createEl("p", { text: this.data.originalText });

        contentEl.createEl("hr");

        const translatedSection = contentEl.createDiv({ cls: "kreativ-text-section" });
        translatedSection.createEl("h3", { text: "Translation" });
        const translatedBox = translatedSection.createDiv({
            cls: "kreativ-text-box kreativ-translation-result",
        });
        translatedBox.createEl("p", { text: this.data.translatedText });

        const buttonContainer = contentEl.createDiv({ cls: "kreativ-button-container" });
        const copyButton = buttonContainer.createEl("button", {
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

        const closeButton = buttonContainer.createEl("button", { text: "Close" });
        closeButton.addEventListener("click", () => this.close());
    }

    onClose(): void {
        const { contentEl } = this;
        contentEl.empty();
    }
}
