import { Plugin, Notice, Menu, MarkdownView } from 'obsidian'
import { DEFAULT_SETTINGS, KreativSettings } from "./settings"
import { KreativSettingTab } from "./ui/settings-tab"
import { SentimentModal } from "./ui/sentiment-modal"
import { ModelLoadProgress } from "../global"
import { UI_STRINGS } from "./constants"

import { WorkerPool } from "./worker/pool"

export default class Kreativ extends Plugin {
	settings!: KreativSettings
	workerPool!: WorkerPool
	private statusBarItem: HTMLElement | null = null
	private progressCallback: ((progress: ModelLoadProgress) => void) | null = null

	async onload() {
		await this.loadSettings()

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new KreativSettingTab(this.app, this))

		this.workerPool = new WorkerPool()

		// Pool-wide progress callback shows model download status in status bar
		this.workerPool.onProgress((progress: ModelLoadProgress) => {
			if (progress.status === "loading") {
				this.showStatusBarProgress(progress.overallProgress)
				// Forward to settings tab if callback is registered
				this.progressCallback?.(progress)
			} else if (progress.status === "ready") {
				this.hideStatusBarProgress()
				this.progressCallback?.(progress)
			}
		})

		this.workerPool.spawn("default").then(async (worker) => {
			if (this.settings.autoLoadModels) {
				try {
					// Build list of models to load based on enabled features
					const modelsToLoad: Array<"sentiment" | "translation" | "rephrasing"> = []
					if (this.settings.enableSentiment) modelsToLoad.push("sentiment")
					if (this.settings.enableTranslation) modelsToLoad.push("translation")
					if (this.settings.enableRephrasing) modelsToLoad.push("rephrasing")

					if (modelsToLoad.length > 0) {
						await worker.warmup(modelsToLoad)
					}
				} catch (err) {
					console.error("Kreativ: model warmup failed:", err)
				}
			}
		}).catch((err) => {
			console.error("Kreativ: failed to initialize worker:", err)
			new Notice(UI_STRINGS.notices.workerInitFailed)
		})

		// Second worker for sentiment analysis
		this.workerPool.spawn("sentiment").catch((err) => {
			console.error("Kreativ: failed to initialize sentiment worker:", err)
		})

		// Ribbon icon with menu for all Kreativ features
		this.addRibbonIcon("brain-circuit", UI_STRINGS.ribbon.tooltip, (event: MouseEvent) => {
			const menu = new Menu()

			menu.addItem((item) =>
				item
					.setTitle(UI_STRINGS.ribbon.analyzeSentiment)
					.setIcon("smile")
					.onClick(() => this.runSentimentAnalysis())
			)

			menu.showAtMouseEvent(event)
		})

		// Sentiment analysis command - requires text selection
		this.addCommand({
			id: "analyze-sentiment",
			name: UI_STRINGS.commands.analyzeSentiment,
			editorCallback: async () => {
				await this.runSentimentAnalysis()
			}
		})
	}

	/**
	 * Run sentiment analysis on currently selected text.
	 * Shows a modal with results or an error notice if no text is selected.
	 */
	private async runSentimentAnalysis(): Promise<void> {
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView)
		const editor = activeView?.editor
		const selectedText = editor?.getSelection()

		if (!selectedText || selectedText.trim().length === 0) {
			new Notice(UI_STRINGS.notices.selectTextFirst)
			return
		}

		const worker = this.workerPool.get("default")
		if (!worker) {
			new Notice(UI_STRINGS.notices.workerNotReady)
			return
		}

		const modal = new SentimentModal(this.app, selectedText)
		modal.open()

		try {
			const result = await worker.sentiment(selectedText)
			modal.setResult(result)
		} catch (err) {
			console.error("[Kreativ] Sentiment analysis failed:", err)
			modal.setError(err instanceof Error ? err.message : String(err))
		}
	}

	/**
	 * Show loading progress in status bar.
	 */
	private showStatusBarProgress(percent: number): void {
		if (!this.statusBarItem) {
			this.statusBarItem = this.addStatusBarItem()
			this.statusBarItem.addClass("kreativ-status-bar")
		}
		this.statusBarItem.setText(`${UI_STRINGS.statusBar.downloading} ${percent}%`)
		this.statusBarItem.show()
	}

	/**
	 * Hide the status bar progress indicator.
	 */
	private hideStatusBarProgress(): void {
		if (this.statusBarItem) {
			this.statusBarItem.hide()
		}
	}

	/**
	 * Register a callback for model progress (used by settings tab).
	 */
	onModelProgress(callback: ((progress: ModelLoadProgress) => void) | null): void {
		this.progressCallback = callback
	}

	/**
	 * Download the sentiment model.
	 */
	async downloadSentimentModel(): Promise<void> {
		const worker = this.workerPool.get("default")
		if (!worker) {
			new Notice(UI_STRINGS.notices.workerNotReady)
			return
		}
		await worker.warmup(["sentiment"])
		// Mark as downloaded in settings
		this.settings.sentimentModelDownloaded = true
		await this.saveSettings()
	}

	/**
	 * Delete the sentiment model from cache.
	 * Clears only sentiment model files from Cache Storage and terminates workers.
	 */
	async deleteSentimentModel(): Promise<boolean> {
		try {
			// Delete only sentiment model files from transformers cache
			const cache = await caches.open("transformers-cache")
			const keys = await cache.keys()
			let deletedCount = 0

			// Delete entries using the original Request objects
			for (const request of keys) {
				if (request.url.includes("Xenova/distilbert-base-uncased-finetuned-sst-2-english")) {
					const deleted = await cache.delete(request)
					if (deleted) {
						deletedCount++
					}
				}
			}

			console.debug(`[Kreativ] Deleted ${deletedCount} sentiment model file(s) from cache`)

			if (deletedCount === 0) {
				console.warn("[Kreativ] Sentiment model not found in cache")
			}

			// Terminate and respawn workers to clear in-memory models
			await this.workerPool.terminateAll()
			await this.workerPool.spawn("default")
			await this.workerPool.spawn("sentiment")

			// Mark as not downloaded in settings
			this.settings.sentimentModelDownloaded = false
			await this.saveSettings()
			return true
		} catch (err) {
			console.error("[Kreativ] Failed to delete model:", err)
			return false
		}
	}

	/**
	 * Check if the sentiment model is downloaded (from settings).
	 */
	isSentimentModelDownloaded(): boolean {
		return this.settings.sentimentModelDownloaded
	}

	onunload() {
		this.hideStatusBarProgress()
		this.workerPool.terminateAll().catch((err) => {
			console.error("Error terminating worker pool on unload:", err)
		})
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<KreativSettings>)
	}

	async saveSettings() {
		await this.saveData(this.settings)
	}
}
