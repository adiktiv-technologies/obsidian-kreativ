import { App, Modal } from "obsidian"
import { SentimentResult } from "../../global"
import { UI_STRINGS } from "../constants"

const S = UI_STRINGS.modal.sentiment

export class SentimentModal extends Modal {
	private selectedText: string
	private result: SentimentResult | null = null
	private isLoading: boolean = true

	constructor(app: App, selectedText: string) {
		super(app)
		this.selectedText = selectedText
	}

	onOpen() {
		const { contentEl } = this
		contentEl.addClass("kreativ-sentiment-modal")
		this.render()
	}

	onClose() {
		const { contentEl } = this
		contentEl.empty()
	}

	setResult(result: SentimentResult) {
		this.result = result
		this.isLoading = false
		this.render()
	}

	setError(error: string) {
		this.result = null
		this.isLoading = false
		this.render(error)
	}

	private render(error?: string) {
		const { contentEl } = this
		contentEl.empty()

		// Header
		contentEl.createEl("h2", { text: S.title })

		// Selected text section
		const textSection = contentEl.createDiv({ cls: "kreativ-sentiment-text" })
		textSection.createEl("h4", { text: S.selectedText })
		const textPreview = textSection.createEl("blockquote")
		textPreview.setText(this.truncateText(this.selectedText, 500))

		// Result section
		const resultSection = contentEl.createDiv({ cls: "kreativ-sentiment-result" })
		resultSection.createEl("h4", { text: S.result })

		if (this.isLoading) {
			resultSection.createEl("p", { text: S.analyzing, cls: "kreativ-loading" })
		} else if (error) {
			resultSection.createEl("p", { text: error, cls: "kreativ-error" })
		} else if (this.result) {
			const labelEl = resultSection.createDiv({ cls: "kreativ-sentiment-label" })
			const emoji = this.getSentimentEmoji(this.result.label)
			labelEl.createSpan({ text: `${emoji} ${this.result.label}` })

			const scoreEl = resultSection.createDiv({ cls: "kreativ-sentiment-score" })
			const percentage = (this.result.score * 100).toFixed(1)
			scoreEl.createSpan({ text: `${S.confidence}: ${percentage}%` })

			// Visual progress bar
			const progressBar = resultSection.createDiv({ cls: "kreativ-progress-bar" })
			const progressFill = progressBar.createDiv({ cls: "kreativ-progress-fill" })
			progressFill.style.width = `${this.result.score * 100}%`
			progressFill.addClass(this.result.label.toLowerCase())
		}

		// Close button
		const buttonContainer = contentEl.createDiv({ cls: "kreativ-modal-buttons" })
		const closeButton = buttonContainer.createEl("button", { text: S.close })
		closeButton.addEventListener("click", () => this.close())
	}

	private truncateText(text: string, maxLength: number): string {
		if (text.length <= maxLength) return text
		return text.substring(0, maxLength) + "..."
	}

	private getSentimentEmoji(label: string): string {
		const lower = label.toLowerCase()
		if (lower === "positive") return "😊"
		if (lower === "negative") return "😔"
		return "😐"
	}
}
