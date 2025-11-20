import { App } from "obsidian";
import * as fs from "fs";
import * as path from "path";

/**
 * Get absolute vault root path - works on Windows/macOS/Linux
 */
export function getVaultRoot(app: App): string {
	const adapter = app.vault.adapter as any;
	return typeof adapter.getBasePath === "function"
		? adapter.getBasePath()
		: adapter.basePath;
}

/**
 * Delete model cache directory from disk
 */
export function deleteModelCache(modelId: string, cacheDir: string): boolean {
	try {
		// Transformers.js uses format: "models--Xenova--t5-small"
		const sanitizedModelId = "models--" + modelId.replace(/\//g, "--");
		const modelPath = path.join(cacheDir, sanitizedModelId);

		if (fs.existsSync(modelPath)) {
			fs.rmSync(modelPath, { recursive: true, force: true });
			console.log(`🗑️ Deleted model cache: ${modelPath}`);
			return true;
		} else {
			// Try alternative format without "models--" prefix
			const altModelPath = path.join(cacheDir, modelId.replace(/\//g, "--"));
			if (fs.existsSync(altModelPath)) {
				fs.rmSync(altModelPath, { recursive: true, force: true });
				console.log(`🗑️ Deleted model cache: ${altModelPath}`);
				return true;
			}
			console.warn(`Model cache not found at: ${modelPath}`);
		}
		return false;
	} catch (error) {
		console.error("Failed to delete model cache:", error);
		return false;
	}
}
