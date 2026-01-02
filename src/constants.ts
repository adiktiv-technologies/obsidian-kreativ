/**
 * UI strings for the settings tab.
 * Grouping strings here prepares for future i18n support.
 */
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

	footer: {
		privacy: "🔒 Privacy First: All AI processing runs locally on your device. No data is sent to external servers.",
		models: "📦 Models are downloaded from Hugging Face on first use and cached for offline operation.",
		translate: "🌐 To translate text: Select text in any note, then open Command Palette (Ctrl/Cmd+P) and search for 'Translate selected text'.",
		tip: "💡 Tip: You can assign a hotkey to the translate command in Obsidian's Hotkeys settings.",
	},
} as const
