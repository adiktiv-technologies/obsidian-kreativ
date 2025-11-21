export interface KreativSettings {
	modelCachePath: string;
	autoLoadModels: boolean;
	sentimentThreshold: number;
	showDetailedResults: boolean;
	translationEnabled: boolean;
	translationSourceLanguage: string;
	translationTargetLanguage: string;
	showRibbonIcon: boolean;
}

export const DEFAULT_SETTINGS: KreativSettings = {
	modelCachePath: ".obsidian/transformers-cache",
	autoLoadModels: true,
	sentimentThreshold: 0.8,
	showDetailedResults: true,
	translationEnabled: false,
	translationSourceLanguage: "English",
	translationTargetLanguage: "German",
	showRibbonIcon: true,
};
