/**
 * Language mapping utilities for translation features.
 */
interface LanguageInfo {
	code: string;          // ISO 639-1 code (e.g., "en")
	name: string;          // Human-readable name (e.g., "English")
}

/**
 * Supported languages for translation features.
 */
export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
	{ code: "en", name: "English" },
	{ code: "de", name: "German" },
	{ code: "fr", name: "French" },
	{ code: "ro", name: "Romanian" },
]

/**
 * UI strings for the settings tab.
 * Grouping strings here prepares for future i18n support.
 */
// TODO Integrate with i18n framework later
export const SETTINGS_STRINGS = {
	heading: "Kreativ",
	description: "Configure local AI features for your vault.",

	modelCaching: {
		heading: "Model caching",
		autoLoad: {
			name: "Auto-load models on startup",
			desc: "Automatically preload ML models when Obsidian starts. Disable to reduce startup time.",
		},
	},

	sentimentAnalysis: {
		heading: "Sentiment analysis",
		model: {
			name: "Sentiment model",
			desc: "Download or delete the sentiment analysis model (~65MB).",
		},
		threshold: {
			name: "Confidence threshold",
			desc: "Minimum confidence score (0-1) required to display sentiment results.",
		},
		enable: {
			name: "Enable sentiment analysis",
			desc: "Analyze the emotional tone of your notes.",
		},
	},

	footer: {
		privacy: "🔒 Privacy First: All AI processing runs locally on your device. No data is sent to external servers.",
		models: "📦 Models are downloaded from Hugging Face on first use and cached for offline operation.",
		translate: "🌐 To translate text: Select text in any note, then open Command Palette (Ctrl/Cmd+P) and search for 'Translate selected text'.",
		tip: "💡 Tip: You can assign a hotkey to the translate command in Obsidian's Hotkeys settings.",
	},
} as const

/**
 * UI strings for notices, commands, menus, and modals.
 */
export const UI_STRINGS = {
	ribbon: {
		tooltip: "Kreativ AI tools",
		analyzeSentiment: "Analyze sentiment",
	},

	commands: {
		analyzeSentiment: "Analyze sentiment of selected text",
	},

	notices: {
		workerNotReady: "Worker not ready. Try again in a moment.",
		selectTextFirst: "Please select some text first.",
		workerInitFailed: "Kreativ: failed to initialize worker. See console for details.",
	},

	statusBar: {
		downloading: "🧠 Downloading model:",
	},

	modelManagement: {
		downloadModel: "📥 Download model",
		deleteModel: "🗑️ Delete model",
		downloading: "Downloading...",
		deleting: "Deleting...",
		modelReady: "Model ready",
	},

	modal: {
		sentiment: {
			title: "Sentiment analysis",
			selectedText: "Selected text",
			result: "Result",
			analyzing: "Analyzing...",
			confidence: "Confidence",
			close: "Close",
		},
	},
} as const
