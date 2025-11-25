/**
 * Language mapping utilities for translation feature
 * Maps language names to T5 model-compatible format
 */

interface LanguageInfo {
	code: string;          // ISO 639-1 code (e.g., "en")
	name: string;          // Human-readable name (e.g., "English")
	t5Name: string;        // Name used by T5 model (e.g., "English")
}

/**
 * Supported languages for T5 Small model translation
 * Based on T5's multilingual capabilities
 */
export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
	{ code: "en", name: "English", t5Name: "English" },
	{ code: "de", name: "German", t5Name: "German" },
	{ code: "fr", name: "French", t5Name: "French" },
	{ code: "ro", name: "Romanian", t5Name: "Romanian" },
];

/**
 * Get language info by code or t5Name
 */
export function getLanguageByCode(code: string): LanguageInfo | undefined {
	return SUPPORTED_LANGUAGES.find(lang => lang.code === code || lang.t5Name === code);
}

/**
 * Get language info by display name
 */
export function getLanguageByName(name: string): LanguageInfo | undefined {
	return SUPPORTED_LANGUAGES.find(lang => lang.name === name);
}
