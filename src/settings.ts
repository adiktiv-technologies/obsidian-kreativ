export interface KreativSettings {
	// Model Settings
	modelCachePath: string;
	autoLoadModels: boolean;

	// Analysis Settings
	sentimentThreshold: number;
	showDetailedResults: boolean;

	// Translation Settings
	translationEnabled: boolean;
	translationSourceLanguage: string;
	translationTargetLanguage: string;

	// UI Settings
	showRibbonIcon: boolean;
}

export const DEFAULT_SETTINGS: KreativSettings = {
	// Model Settings
	modelCachePath: ".obsidian/transformers-cache",
	autoLoadModels: true,

	// Analysis Settings
	sentimentThreshold: 0.8,
	showDetailedResults: true,

	// Translation Settings
	translationEnabled: false,
	translationSourceLanguage: "English",
	translationTargetLanguage: "German",

	// UI Settings
	showRibbonIcon: true,
};
