export interface KreativSettings {
    // Model Settings
    modelCachePath: string;
    autoLoadModels: boolean;

    // Analysis Settings
    sentimentThreshold: number;
    showDetailedResults: boolean;

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

    // UI Settings
    showRibbonIcon: true,
};
