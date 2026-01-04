export interface KreativSettings {
	autoLoadModels: boolean
	// Feature toggles - determines which models to load on warmup
	enableSentiment: boolean
	enableTranslation: boolean
	enableRephrasing: boolean
	// Sentiment analysis settings
	sentimentThreshold: number
	// Model download state (tracked in settings for simplicity)
	sentimentModelDownloaded: boolean
}

export const DEFAULT_SETTINGS: KreativSettings = {
	autoLoadModels: false,
	enableSentiment: true,
	enableTranslation: false,
	enableRephrasing: false,
	sentimentThreshold: 0.5,
	sentimentModelDownloaded: false
}
