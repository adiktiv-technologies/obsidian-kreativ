import { App, Modal, Setting } from "obsidian";

export interface SentimentData {
    text: string;
    label: string;
    score: number;
}

export class SentimentResultModal extends Modal {
    private readonly data: SentimentData;

    constructor(app: App, data: SentimentData) {
        super(app);
        this.data = data;
    }

    onOpen(): void {
        const { contentEl } = this;
        contentEl.empty();

        this.renderHeader();
        this.renderInputText();
        this.renderLabel();
        this.renderConfidence();
        this.renderCloseButton();
    }

    onClose(): void {
        this.contentEl.empty();
    }

    private renderHeader(): void {
        this.contentEl.createEl("h2", { text: "Sentiment Analysis Result" });
    }

    private renderInputText(): void {
        const preview = this.data.text.substring(0, 100);
        const truncated = this.data.text.length > 100 ? "…" : "";

        new Setting(this.contentEl)
            .setName("Input Text")
            .setDesc(preview + truncated);
    }

    private renderLabel(): void {
        new Setting(this.contentEl)
            .setName("Label")
            .addText((text) => text.setValue(this.data.label).setDisabled(true));
    }

    private renderConfidence(): void {
        const confidence = `${(this.data.score * 100).toFixed(2)}%`;

        new Setting(this.contentEl)
            .setName("Confidence")
            .addText((text) => text.setValue(confidence).setDisabled(true));
    }

    private renderCloseButton(): void {
        new Setting(this.contentEl).addButton((button) =>
            button.setButtonText("Close").onClick(() => this.close())
        );
    }
}
